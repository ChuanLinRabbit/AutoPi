/**
 * @param axiosInstance 通过axios.create创建的实列
 * @param openApiJsonDataList openApi配置文件v2链表
 * @return {AutoAxios}
 */
export function useAutoAxios(axiosInstance: any, openApiJsonDataList: any): AutoAxios;
declare class AutoAxios {
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
    constructor(axiosInstance: any, openApiJsonDataList: any);
    service: any;
    API: any;
    waitList: any[];
    startList: any[];
    log: any[];
    maxCount: number;
    logLength: number;
    /**
     * 生成Axios配置
     * @param url
     * @param data
     * @param tempConfig
     * @return {*|{headers: null, method: null, data: {}, params: {}, url: null}}
     */
    getAxiosConfig(url: any, data: any, tempConfig: any): any | {
        headers: null;
        method: null;
        data: {};
        params: {};
        url: null;
    };
    /**
     * 发送请求
     * @param url
     * @param data
     * @param tempConfig
     */
    sendAxios(url: any, data: any, tempConfig: any): Promise<unknown>;
    /**
     * 批量发送请求
     * @param {[{url,data,tempConfig}]} arr
     */
    sendAll(arr: [{
        url;
        data;
        tempConfig;
    }]): Promise<any>;
    /**
     * 以formData形式发送文件(不入队列)
     */
    sendFile(url: any, data: any, tempConfig: any): any;
    /**
     * 排序请求防止高并发
     * @param config
     * @return {Promise<unknown>}
     */
    queueSend(config: any): Promise<unknown>;
    /**
     * 发送一个请求，将结果抛给外层函数
     * @private
     * @param config 请求参数
     * @param resolve 外层函数的成功接收
     * @param reject 外层函数的失败接收
     * @return Void
     */
    private sendOne;
    /**
     * 记录日志
     * @private
     * @param config
     * @param res
     */
    private addLog;
}
export {};
