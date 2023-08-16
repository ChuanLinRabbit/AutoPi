import qs from 'qs'
import {createFormData} from './commonUtil'
import {queryDefinitionByRef} from "./commonUtil";

/**
 * 通过url查找openApi中的配置，完成基本配置自动生成与参数校验及分配
 */
class AutoApi {
    /**
     * @constructor
     * @param {String} url 请求路径
     * @param {Object|Array} data 发送数据
     * @param {Object} tempConfig 扩展配置
     * @param {Array} API 接口库链表
     * @property {Array} API 接口库链表
     * @property {String} url 请求路径
     * @property {Object|Array} data 发送数据
     * @property {Object} tempConfig 扩展配置
     * @property {Object} currentService 当前微服务的配置 todo 未考虑不同微服务中url相同的情况
     * @property {Object} openApiConfig 具体路径指向的接口配置
     * @property {Object} apiConfig 组装的axios请求参数
     * @property {Array} warnRequiredParams 必填校验警告组
     * @property {Array} warnTypeParams 类型校验警告组
     */
    constructor(url, data, tempConfig, API) {
        this.API = API
        this.url = url
        this.data = data
        this.tempConfig = tempConfig
        this.openApiConfig = null
        this.currentService = {}
        this.apiConfig = {
            url: null,
            method: null,
            headers: null,
            data: {},
            params: {}
        }
        this.warnRequiredParams = []
        this.warnTypeParams = []
    }

    init() {
        this.getOpenApiConfig()
        this.verifyOpenApiConfig()
        this.initApiBaseConfig()
        this.initApiData()
        this.readTempConfig()
    }

    /**
     * 遍历所有微服务，根据url取openApi配置
     */
    getOpenApiConfig() {
        let {url} = this
        for (let service of this.API) {
            if (service.paths[url]) {
                this.openApiConfig = service.paths[url]
                this.currentService = service
                break;
            }
        }
    }

    /**
     * 确保获取到目标配置
     */
    verifyOpenApiConfig() {
        let {url, openApiConfig, tempConfig} = this
        // 未找到配置的提示
        if (!openApiConfig) throw Error(`API "${url}" NOT FOUND`)
        // 当同一url有多个method时报告错误
        if (Object.keys(openApiConfig).length > 1) {
            if (!tempConfig?.method) {
                throw Error(`API "${url}" has multiple method, you must set method for this api`)
            }
        }
    }

    /**
     * 生成config配置的基础参数
     */
    initApiBaseConfig() {
        let {url, apiConfig, currentService, data, tempConfig, openApiConfig} = this
        // url
        // 拼接微服务名
        apiConfig.url = currentService.basePath + url
        // 根据动态url中{键名}进行复制
        while (/(\{\w+\})/.test(apiConfig.url)) {
            apiConfig.url = apiConfig.url.replace(RegExp.$1, data[RegExp.$1.substring(1, RegExp.$1.length - 1)])
        }
        // method
        apiConfig.method = Object.keys(openApiConfig)[0]
        // 如果url重复，使用设定的请求方式
        if (tempConfig && tempConfig.method) apiConfig.method = tempConfig.method
        // header
        apiConfig.headers = {
            'Content-Type': 'application/json;charset=utf-8'
        }
    }

    /**
     * 生成config使用的参数
     */
    initApiData() {
        // 展开参数配置中的映射
        let parameters = this.openApiConfig[this.apiConfig.method].parameters
        // 校验必填与数据类型 todo 未处理请求体为纯字符与纯数字的情况
        // 使用parameters存储请求体的情况
        if (parameters) this.apiConfig.data = chargeByParameters(parameters, this.data, this)
        // 使用requestBody存储请求体的情况
        if (!parameters) {
            let requestBody = this.openApiConfig[this.apiConfig.method].requestBody
            if (requestBody) {
                let refName = requestBody.content['application/json']?.schema?.$ref || requestBody.content['*/*']?.schema?.$ref
                if (refName) {
                    let _schema = queryDefinitionByRef(this.currentService, refName)
                    this.apiConfig.data = chargeByDefinition(_schema, this.data, this)
                } else {
                    this.apiConfig.data = this.data
                }
            }
        }
        // 如通过未验证执行异常处理
        this.printVerifyParameters()
    }

    /**
     * 输出参数合法验证结果
     */
    printVerifyParameters() {
        let {url, data, warnRequiredParams, warnTypeParams} = this
        if (warnRequiredParams?.length) {
            let warnRequiredDescription = warnRequiredParams.map(item => item.description)
            let warnRequiredName = warnRequiredParams.map(item => item.name)
            console.error(`API "${url}" 中，必填项【${warnRequiredDescription.toString()}】未填写`)
            console.error(`API "${url}" parameters must contain "${warnRequiredName.toString()}"`)
            return `必填项【${warnRequiredDescription.toString()}】未填写`
        }
        if (warnTypeParams?.length) {
            for (let param of warnTypeParams) {
                console.error(`API "${url}" parameter "${param.name}" is not ${param.type}`)
            }
        }
        if (warnRequiredParams?.length || warnTypeParams?.length) {
            console.error(`API "${url}" parameters is not support`)
            console.error(`your data is`, data)
        }
    }

    /**
     * 将附加的tempConfig覆盖到当前config
     * @return {*}
     */
    readTempConfig = function () {
        let {tempConfig, apiConfig} = this
        if (tempConfig) {
            if (tempConfig.headers) {
                tempConfig.headers = Object.assign(apiConfig.headers, tempConfig.headers)
            }
            Object.assign(apiConfig, tempConfig)
        }
    }
}

/**
 * 根据parameters结构化参数
 * @param {Object} parameters
 * @param {Object} data
 * @param {Object} ApiInstance
 */
function chargeByParameters(parameters, data, ApiInstance) {
    let result = {}
    for (let parameter of parameters) {
        // 必填校验
        if (!data || data[parameter.name] === null || data[parameter.name] === undefined) {
            if (parameter.required && !parameter.schema) {
                ApiInstance.warnRequiredParams.push(parameter)
                continue
            }
        }
        // 参数取值
        if (parameter.schema) {
            let _schema = null
            if (parameter.schema.$ref) {
                _schema = queryDefinitionByRef(ApiInstance.currentService, parameter.schema.$ref)
                result[parameter.name] = chargeByDefinition(_schema, data, ApiInstance)
            } else {
                _schema = parameter.schema
                result[parameter.name] = chargeByDefinition(_schema, data[parameter.name], ApiInstance)
            }
        } else {
            result[parameter.name] = chargeByDefinition(parameter, data[parameter.name], ApiInstance)
        }
        // 参数位置派发
        // 特殊处理body是schema以及数组schema的情况
        if (parameter.schema) {
            if (parameter.schema.type && parameter.schema.type === 'array') {
                if (Object.prototype.toString.call(data) === '[object Array]') {
                    return data
                } else {
                    result = result[parameter.name || '_Array']
                    delete result[parameter.name || '_Array']
                }
            } else if (parameter.schema.$ref) {
                Object.assign(result, result[parameter.name])
                delete result[parameter.name]
            }
        }
        if (result[parameter.name] === null) {
            delete result[parameter.name]
        }
        if (parameter.in === 'path') {
            delete result[parameter.name]
        }
        // 接口含有query参数的情况
        let qsParam = null
        if (parameter.in === 'query' && (result[parameter.name] || result[parameter.name] === 0)) {
            if (!qsParam) qsParam = {}
            qsParam[parameter.name] = result[parameter.name]
            delete result[parameter.name]
        }
        if (qsParam) {
            if (ApiInstance.apiConfig.url.includes('?')) ApiInstance.apiConfig.url += `&${qs.stringify(qsParam)}`
            else ApiInstance.apiConfig.url += `?${qs.stringify(qsParam)}`
        }
    }
    return result
}

/**
 * 根据Definition配置结构化参数
 * @param {Object} schema
 * @param {Object} data
 * @param {Object} ApiInstance
 */
function chargeByDefinition(schema, data, ApiInstance) {
    if (!data && data !== 0 && data !== "" && data !== false) return null
    let result = null
    // 对象内容筛选
    if (schema?.type === 'object') {
        result = {}
        if (schema.properties) {
            for (let key in schema.properties) {
                let property = schema.properties[key]
                let value = data[key]
                // 非空校验
                if (value === null || value === undefined) {
                    if (schema.required && schema.required.includes(key)) {
                        ApiInstance.warnRequiredParams.push(property)
                    }
                    continue
                }
                // 多层映射递归读取
                if (property.$ref) {
                    let _schema = queryDefinitionByRef(ApiInstance.currentService, property.$ref)
                    if (Object.prototype.toString.call(value) === '[object Object]') {
                        result[key] = chargeByDefinition(_schema, value, ApiInstance)
                    } else {
                        ApiInstance.warnTypeParams.push(property)
                    }
                } else {
                    result[key] = chargeByDefinition(property, value, ApiInstance)
                }
            }
        } else if (schema.additionalProperties.type === "object") {
            return data
        }
    }
    // 数组内容筛选参数
    else if (schema?.type === 'array') {
        return data
        // todo 数组过滤未完善
        // if (Object.prototype.toString.call(data) === '[object Array]') {
        //     result = []
        //     if (data.length > 0) {
        //         for (let index of data) {
        //             let arrayItem = data[index]
        //             if (property.items.$ref) {
        //                 let _schema = queryDefinitionByRef(ApiInstance.currentService, property.items.$ref)
        //                 result[index] = chargeByDefinition(_schema, arrayItem, ApiInstance)
        //             } else {
        //                 let _schema = property.items
        //                 result[index] = chargeByDefinition(_schema, arrayItem, ApiInstance)
        //             }
        //         }
        //     }
        // } else {
        //     ApiInstance.warnTypeParams.push(property)
        // }
    } else if (schema?.type === 'string') {
        if (typeof data === 'string') {
            return data
            // 文件类型的
        } else if (typeof data === 'object') {
            return data
        } else if (typeof data === 'number') {
            return data.toString()
        } else {
            ApiInstance.warnTypeParams.push(schema)
        }
    } else if (schema?.type === 'integer') {
        if (typeof data === 'number') {
            return data
        } else if (!isNaN(data)) {
            return Number(data)
        } else {
            ApiInstance.warnTypeParams.push(schema)
        }
    } else {
        return data
    }
    return result
}

class AutoAxios {
    /**
     * @constructor
     * @param axiosInstance 通过axios.create创建的实列
     * @param openApiJsonDataList openApi配置文件v2链表
     * @property {[]} waitList 等待队列（readonly）
     * @property {[]} startList 执行队列（readonly）
     * @property {[]} log 请求日志
     * @property {Number} maxCount 最大并发数
     * @property {Number} logLength 最大日志数
     */
    constructor(axiosInstance, openApiJsonDataList) {
        this.service = axiosInstance
        this.API = openApiJsonDataList
        this.waitList = []
        this.startList = []
        this.log = []
        this.maxCount = 5
        this.logLength = 100
    }

    /**
     * 生成Axios配置
     * @param url
     * @param data
     * @param tempConfig
     * @return {*|{headers: null, method: null, data: {}, params: {}, url: null}}
     */
    getAxiosConfig(url, data, tempConfig) {
        let autoApi = new AutoApi(url, data, tempConfig, this.API)
        autoApi.init()
        return autoApi.apiConfig
    }

    /**
     * 发送请求
     * @param url
     * @param data
     * @param tempConfig
     */
    sendAxios(url, data, tempConfig) {
        let config = this.getAxiosConfig(url, data, tempConfig)
        return this.queueSend(config)
    }

    /**
     * 批量发送请求
     * @param {[{url,data,tempConfig}]} arr
     */
    sendAll(arr) {
        let result = new Array(arr.length)
        let promiseArr = []
        for (let index in arr) {
            let config = arr[index]
            let axiosConfig = this.getAxiosConfig(config.url, config.data, config.tempConfig)
            axiosConfig.noMask = true
            promiseArr.push(this.queueSend(axiosConfig).then(res => {
                result[index] = res
            }))
        }
        return new Promise(resolve => {
            Promise.all(promiseArr).finally(() => {
                resolve(result)
            })
        })
    }

    /**
     * 以formData形式发送文件(不入队列)
     */
    sendFile(url, data, tempConfig) {
        let config = this.getAxiosConfig(url, data, tempConfig)
        config.headers['Content-Type'] = 'multipart/form-data'
        config.data = createFormData(data)
        return this.service.request(config)
    }

    /**
     * 排序请求防止高并发
     * @param config
     * @return {Promise<unknown>}
     */
    queueSend(config) {
        config._tempId = Math.random()
        if (this.startList.length < this.maxCount) {
            this.startList.push(config)
            return new Promise((resolve, reject) => {
                this.sendOne(config, resolve, reject)
            })
        } else {
            this.waitList.push(config)
            return new Promise((resolve, reject) => {
                let timer = setInterval(() => {
                    if (this.waitList[0] === config && this.startList.length < 5) {
                        clearInterval(timer)
                        this.startList.push(config)
                        this.sendOne(config, resolve, reject)
                        this.waitList.splice(0, 1)
                    }
                }, 100)
            })
        }
    }

    /**
     * 发送一个请求，将结果抛给外层函数
     * @private
     * @param config 请求参数
     * @param resolve 外层函数的成功接收
     * @param reject 外层函数的失败接收
     * @return Void
     */
    sendOne(config, resolve, reject) {
        this.service.request(config).then(res => {
            this.startList.splice(this.startList.findIndex(item => item._tempId = config._tempId), 1)
            this.addLog(config,res)
            resolve(res)
        }).catch(res => {
            this.startList.splice(this.startList.findIndex(item => item._tempId = config._tempId), 1)
            this.addLog(config, res)
            reject(res)
        })
    }

    /**
     * 记录日志
     * @private
     * @param config
     * @param res
     */
    addLog(config, res) {
        const apiLog = {request: config, response: res}
        if(this.log.length > this.logLength) this.log.pop()
        this.log.unshift(apiLog)
    }
}

/**
 * @param axiosInstance 通过axios.create创建的实列
 * @param openApiJsonDataList openApi配置文件v2链表
 * @return {AutoAxios}
 */
export function useAutoAxios(axiosInstance, openApiJsonDataList) {
    return new AutoAxios(axiosInstance, openApiJsonDataList)
}