/**
 * 区间判断
 * @param value
 * @param range
 * @return {boolean|void|*}
 *
 * @example
 * isRangeIn(55,'[50,60]')
 * 中括号开区间，小括号闭区间，大括号枚举匹配，直接填入数值判断等于
 */
export const isRangeIn = function (value, range) {
    let isContainMin = false
    let isContainMax = false
    let isGTMin = false
    let isLTMax = false
    if(!value && value !== 0) return false
    if(!isNaN(value)) value = Number(value)
    else return console.error('isRangeIn first param "value" is NaN')
    if(!isNaN(range)) return value === Number(range)
    if(range.includes('{') && range.includes('}')) {
        let arrString = range.replace(/\{|}/g,'')
        let arr = arrString.split(',')
        arr = arr.map(item => {
            return Number(item)
        })
        return arr.includes(value)
    }
    let rangeArr = range.split(',')
    if(rangeArr[0].includes('[')) isContainMin = true
    if(rangeArr[1].includes(']')) isContainMax = true
    let min = rangeArr[0].replace(/\[|]|\(|\)/g,'') || -Infinity
    let max = rangeArr[1].replace(/\[|]|\(|\)/g,'') || Infinity
    if(isContainMin) {
        isGTMin = value >= min
    }else {
        isGTMin = value > min
    }
    if(isContainMax) {
        isLTMax = value <= max

    }else {
        isLTMax = value < max
    }
    return isLTMax && isGTMin
}

export const getTreeByList = function (list, extendProps = {}, ) {
    let props = {
        id: 'id',
        children: 'children',
        parentId: 'parentId'
    }
    Object.assign(props,extendProps)
    list.forEach((parent) => {
        parent.tempChildren = list.filter(child => child[props.parentId] === parent[props.id] && parent[props.id] && child[props.parentId])
        parent.tempChildren.forEach(item => {item._hasParent = true})
        if(parent[props.children]) parent[props.children] = parent[props.children].concat(parent.tempChildren)
        else {
            parent[props.children] = parent.tempChildren
            delete parent.tempChildren
        }
    })
    let result = list.filter(item => !item._hasParent)
    list.forEach(item => {
        delete item._hasParent
    })
    return result
}

/**
 * 为list设置parentIds
 * @param list
 */
export const setParentIds4List = function (list) {
    list.forEach(data => {
        let parentIds = []
        let nextParentId = data.parentId
        while (nextParentId) {
            parentIds.push(nextParentId)
            let parentNode = list.find(item => item.id === nextParentId)
            if(parentNode) nextParentId = parentNode.parentId
            else nextParentId = null
        }
        data._parentIds = parentIds.reverse()
    })
}

// 数字转汉字
const digits_zh = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九']
const decimal_zh = ['','十','百','千',]
const comma_zh = ['万','亿']
// 字符分组
export function string_to_array (str,step) {
    let r = [];
    function doGroup(s) {
        if (!s) return;
        r.push(s.substr(0, step));
        s = s.substr(step);
        doGroup(s)
    }
    doGroup(str);
    return r;
}

/**
 * 获取符合openApi中$Ref格式的内容
 * @param {Object} target
 * @param {String} refName
 * @param {String} splitString
 */
export function queryDefinitionByRef(target, refName, splitString = '/') {
    let refArray = refName?.split(splitString)
    refArray.shift() // 抛出"#"
    let tempSchema = target
    while(refArray.length > 0) {
        if(!tempSchema) return tempSchema
        let tempKey = refArray.shift()
        if(tempKey === '$JSONParse') {
            try {
                tempSchema = JSON.parse(tempSchema)
            }catch (e) {
                return tempSchema
            }
        }else {
            if(typeof tempSchema !== 'object') {
                if (!tempSchema && tempSchema !== 0) return ''
                return tempSchema
            }
            // todo __将不再支持
            if(tempKey.includes('__')) {
                tempSchema = tempSchema[tempKey.replace('__', '')]
            }else {
                tempSchema = tempSchema[tempKey]
            }
        }
    }
    return tempSchema
}

/**
 * 设置符合openApi中$Ref格式的内容
 * @param {Object} target
 * @param {String} refName
 * @param {Any} value
 * @param {String} splitString
 */
export function setDefinitionByRef(target, refName, value, splitString = '/') {
    let refArray = refName?.split(splitString)
    refArray.shift() // 抛出"#"
    let tempSchema = target
    while(refArray.length > 1) {
        if(typeof tempSchema !== 'object') {
            console.error(`${tempSchema} is not object`)
        }
        let tempKey = refArray.shift()
        if(tempKey.includes('__')) tempKey = tempKey.replace('__', '')
        if(!tempSchema[tempKey] && refArray[0].includes('__')) tempSchema[tempKey] = []
        else if(!tempSchema[tempKey]) tempSchema[tempKey] = {}
        tempSchema = tempSchema[tempKey]
    }
    let tempKey = refArray.shift()
    tempSchema[tempKey] = value
    return true
}

/**
 * 判断一个对象是否符合要求
 * @param {{key,value,condition,prop,eval,enum,dateFormat,must,should,matchFuncName}} config
 * @param {{}} data
 * @param {{}} [myFuncMap]
 * @return {boolean|*}
 */
export function match(config, data, myFuncMap = {}) {
    const funcMap = Object.assign({}, defaultHooks, myFuncMap)
    if(config.must) {
        return checkMust(config.must, data, funcMap)
    }
    if(config.should) {
        return checkShould(config.should, data, funcMap)
    }
    if(config.condition) {
        let left = config.left
        let right = config.right || config.value
        if(config.key) {
            if(typeof config.key === "string") {
                config.prop = config.key
                left = chargeValue(config, data)
            }else {
                left = config.key
            }
        }
        // todo matchFuncName将弃用，不再使用，兼容旧代码
        if(config.matchFuncName) {
            right = funcMap[config.matchFuncName](data)
        }
        if(config.rightFuncName) {
            right = funcMap[config.rightFuncName](data)
        }
        if(config.leftFuncName) {
            left = funcMap[config.leftFuncName](data)
        }
        if(config.condition === 'eq') {
            return left === right
        }
        if(config.condition === 'neq') {
            return left !== right
        }
        if(config.condition === 'in') {
            if(['String', 'Array'].includes(type(right))) {
                return right?.includes(left)
            }else {
                console.error(`${right} is not String|Array`)
            }
        }
        if(config.condition === 'nin') {
            if(['String', 'Array'].includes(type(right))) {
                return !right?.includes(left)
            }else {
                console.error(`${right} is not String|Array`)
            }
        }
        if(config.condition === 'has') {
            if(['String', 'Array'].includes(type(left))) {
                return left?.includes(right)
            }else {
                console.error(`${left} is not String|Array`)
            }
        }
        if(config.condition === 'nhas') {
            if(['String', 'Array'].includes(type(left))) {
                return !left?.includes(right)
            }else {
                console.error(`${left} is not String|Array`)
            }
        }
        if(config.condition === 'exist') {
            return !!left
        }
        if(config.condition === 'nexist') {
            return !left
        }
    }
    if(config.matchFuncName) {
        return funcMap[config.matchFuncName](data)
    }
    if(config.canIUse) {
        return funcMap[config.canIUse](data)
    }
    return true
}

/**
 * 通用条件判断must
 */
export function checkMust(must, row, myFuncMap) {
    const funcMap = Object.assign({}, defaultHooks, myFuncMap)
    let result = []
    for(let item of must) {
        result.push(match(item, row, funcMap))
    }
    return !result.includes(false)
}

/**
 * 通用条件判断should
 */
export function checkShould(should, row, myFuncMap) {
    const funcMap = Object.assign({}, defaultHooks, myFuncMap)
    let result = []
    for(let item of should) {
        result.push(match(item, row, funcMap))
    }
    return result.includes(true)
}

/**
 * 微编译
 * @param {string} keyword
 * @param option
 * @return {null|*}
 */
export function seesTrans(keyword, option = {funcMap: {}, dictMap: {}, schema: {}, tansPromiseList: [], key: '', parent: {}, evalProp: {}, dataMap: {}}) {
    option.funcMap = Object.assign({}, defaultHooks, option.funcMap)
    // todo __promise__将弃用
    // if (keyword.includes('__promise__')) {
    //     let funcName = keyword.replace('__promise__', '')
    //     if (option.funcMap[funcName]) {
    //         let promiseInstance = option.funcMap[funcName]()
    //         option.tansPromiseList.push(promiseInstance)
    //         promiseInstance.then(res => {
    //             option.parent[option.key] = res
    //         })
    //     }
    //     return null
    // }
    if (keyword.includes('__dataMap__')) {
        let dataKey = keyword.replace('__dataMap__', '')
        if (option.dataMap[dataKey]) {
            return option.dataMap[dataKey]
        }else {
            return null
        }
    }
    if (keyword.includes('__color__')) {
        let colorPath = keyword.replace('__color__', '#/')
        return queryDefinitionByRef(color, colorPath)
    }
    if (keyword.includes('__getter__')) {
        let funcName = keyword.replace('__getter__', '')
        if (option.funcMap[funcName]) {
            return option.funcMap[funcName]()
        }else {
            return null
        }
    }
    if (keyword.includes('__funcPointer__')) {
        let funcName = keyword.replace('__funcPointer__', '')
        if (option.funcMap[funcName]) {
            return option.funcMap[funcName]
        }else {
            return () => {}
        }
    }
    // todo __dict__将弃用
    // if (keyword.includes('__dict__')) {
    //     let dictKey = keyword.replace('__dict__', '')
    //     return option.dictMap.value[dictKey]
    // }
    if (keyword.includes('__schema__')) {
        let schemaName = keyword.replace('__schema__', '')
        return option.schema[schemaName] || keyword
    }
    if (keyword.includes('__schemaFlat__')) {
        let schemaName = keyword.replace('__schemaFlat__', '')
        let index = option.parent.findIndex(item => item === keyword)
        option.parent.splice(index, 0, ...option.schema[schemaName])
        return undefined
    }
    if (keyword.includes('__eval__')) {
        let funStr = keyword.replace('__eval__', '')
        let func = new Function(...Object.keys(option.evalProp), `return ${funStr}`)
        return func(...Object.values(option.evalProp))
    }
    return keyword
}

/**
 * 值解析
 * @param {{}} config
 * @param {{}} row
 * @param {{}} [myFuncMap]
 * @return {*}
 */
export function chargeValue(config, row, myFuncMap) {
    const funcMap = Object.assign({}, defaultHooks, myFuncMap)
    let _value = ''
    if (config.prop.includes('#/')) {
        _value = queryDefinitionByRef(row, config.prop)
    } else {
        _value = row[config.prop]
    }
    if (config.eval) {
        _value = new Function('row', '_value' , `return ${config.eval}`)(row, _value)
    }else if (config.enum) {
        let findItem = config.enum.find(item => item.id === _value)
        if(findItem) _value = findItem?.name
    }else if (config.funcName) {
        let func = funcMap[config.funcName]
        if(func) _value = func(row, _value)
    }
    // 格式处理 日期
    if (config.dateFormat) {
        if(config.rangeKey) {
            _value = row[config.rangeKey[0]] + '~' + row[config.rangeKey[1]]
        } else if(_value) {
            _value = dayjs(_value).format(config.dateFormat)
        }
    }

    return _value
}

/**
 * 统一获取异步数据
 * @param promiseMap
 * @param myFuncMap
 * @return {Promise<{}>}
 */
export async function getPromiseDataMap(promiseMap, myFuncMap) {
    if(!promiseMap) return Promise.resolve({})
    const PromiseList = []
    const dataMap = {}
    for(let key in promiseMap) {
        let funcName = promiseMap[key]
        let funcMap = Object.assign({}, defaultHooks, myFuncMap)
        if(funcMap[funcName]) {
            let promiseInstance = funcMap[funcName]()
            PromiseList.push(promiseInstance)
            promiseInstance.then(res => {
                dataMap[key] = res
            })
        }
    }
    await Promise.all(PromiseList)
    return Promise.resolve(dataMap)
}

/**
 * 获得解析后的直观配置
 * @param data
 * @param params
 */
export function getTransOption(data, params) {
    if(['[object Object]','[object Array]'].includes(Object.prototype.toString.call(data))) {
        let container = null
        let filterData = null
        if(Object.prototype.toString.call(data) === '[object Array]') {
            container = []
            filterData = []
        }
        if(Object.prototype.toString.call(data) === '[object Object]') {
            container = {}
            filterData = {}
        }
        // 过滤没有权限或者需要隐藏的项目
        for(let key in data) {
            if(Object.prototype.toString.call(data[key]) === '[object Object]') {
                let hidden = false
                if(data[key].hidden) {
                    if(data[key].hidden && type(data[key].hidden) === 'String') {
                        hidden = seesTrans(data[key].hidden, params)
                    }
                    if(data[key].hidden && type(data[key].hidden) === 'Boolean') {
                        hidden = data[key].hidden
                    }
                    if(data[key].hidden && type(data[key].hidden) === 'Object') {
                        hidden = match(data[key].hidden, params.dataMap, params.funcMap)
                    }
                    if(!hidden && hasPerms(data[key])) {
                        filterData[key] = clone(data[key])
                        delete filterData[key].hidden
                    }
                }else {
                    if(hasPerms(data[key])) {
                        filterData[key] = data[key]
                    }
                }
            }else {
                filterData[key] = data[key]
            }
        }
        if(Object.prototype.toString.call(container) === '[object Array]') {
            for(let key in filterData) {
                params.key = key
                params.parent = container
                let tempResult = getTransOption(filterData[key], params)
                if(tempResult !== undefined) container.push(getTransOption(filterData[key], params))
            }
        }
        if(Object.prototype.toString.call(container) === '[object Object]') {
            for(let key in filterData) {
                params.key = key
                params.parent = container
                container[key] = getTransOption(filterData[key], params)
            }
        }
        return container
    }
    if(type(data) === 'String') return seesTrans(data, params)
    return data
}

/**
 * 获取翻译后的设置
 * @returns {Promise<void>}
 */
export async function getAsyncSchema(option, myFuncMap = {}) {
    let dictMap = {}
    let promiseMap = {}
    let funcMap = Object.assign({}, defaultHooks, myFuncMap)
    let promise1 = getDictMap(option.dict).then(res => {
        dictMap = res
    })
    let promise2 = getPromiseDataMap(option.promise, funcMap).then(res => {
        promiseMap = res
    })
    await Promise.all([promise1, promise2])
    return Promise.resolve({...dictMap, ...promiseMap})
}

/**
 * 根据后端数据，反解前端数据
 * @param cells
 * @param data
 * @return {*}
 */
export function changeDataByItems(cells, data) {
    // todo plusMap为数组的情况未处理，可以扩展plusArray,packMap,packArray字段
    for(let tr of cells) {
        for(let cell of tr) {
            if(cell.plusMap) {
                for(let remoteKey in cell.plusMap) {
                    let value = data[remoteKey]
                    if(!value) continue
                    if(cell.enum) continue
                    let frontKey = cell.plusMap[remoteKey]
                    if(!data[cell.key]) data[cell.key] = {}
                    data[cell.key][frontKey] = data[remoteKey]
                }
            }
            if(cell.pickMap && match(cell, data)) {
                for(let remoteKey in cell.pickMap) {
                    let value = data[remoteKey]
                    if(!value) continue
                    let keyMap = cell.pickMap[remoteKey]
                    if(!data[cell.key]) data[cell.key] = []
                    data[cell.key] = data[remoteKey].map(item => {
                        for(let pickMapItemKey in keyMap) {
                            let pickMapItemValue = keyMap[pickMapItemKey]
                            if(pickMapItemValue === 'id')
                                return item[pickMapItemKey]
                        }
                    })
                }
            }
            if(cell.dateFormat) {
                if(cell.rangeKey) {
                    let value1 = data[cell.rangeKey[0]]
                    let value2 = data[cell.rangeKey[1]]
                    if(value1 && value2) {
                        data[cell.key] = [dayjs(value1).format(cell.dateFormat), dayjs(value2).format(cell.dateFormat)]
                        data[cell.rangeKey[0]] = dayjs(value1).format(cell.dateFormat)
                        data[cell.rangeKey[1]] = dayjs(value2).format(cell.dateFormat)
                    }
                }else {
                    let value = data[cell.key]
                    if(!value) continue
                    data[cell.key] = dayjs(value).format(cell.dateFormat)
                }
            }
        }
    }
    return data
}

/**
 * 转换data为should形式
 * @param searchItems
 * @param sendData
 * @return {*[]}
 */
export function chargeSendData2Should(searchItems, sendData) {
    let should = []
    let searchItemsMap = indexBy(prop('key'),searchItems)
    for(let key in sendData) {
        let config = searchItemsMap[key]
        if(config.condition && sendData[key]) {
            if(config.tag === 'radio' || config.tag === 'input') {
                should.push([value2Must(config, sendData[key])])
            }
            if(config.tag === 'checkbox') {
                let valueArr = sendData[key].split(',')
                should.push(valueArr.map(value2Must(config)))
            }
        }
    }
    return should
}

/**
 * 将多选转换成shouldItem
 * @param config
 * @param val
 * @return {{}}
 */
export const value2Must = curry(value2Must_Root)
function value2Must_Root(config, val) {
    if(!val) return {}
    return {
        key: config.key,
        condition: config.condition,
        value: val
    }
}

/**
 * 通过items配置获取must参数
 * @param items
 * @param data
 * @param keys
 * @return {*[]}
 */
export function getMust(items, data, keys) {
    let must = []
    items.forEach(item => {
        if(keys && !keys.includes(item.key)) return
        let value = data[item.key]
        if(!value && value !== 0) return
        if(item.toNum) value = Number(value)
        if(item.condition === 'range' && value.length === 2) {
            must.push({
                key: item.key,
                value: value[0],
                condition: 'ge'
            })
            must.push({
                key: item.key,
                value: value[1],
                condition: 'le'
            })
        }
        else {
            let condition = item.condition ?? 'eq'
            must.push({
                key: item.key,
                value: value,
                condition: condition
            })
        }
    })
    return must
}