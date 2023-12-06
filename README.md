AutoPi_0.1.2
===
安装
---
`npm i auto-pi`

使用
---
```javascript
import {useAutoAxios} from "auto-pi"

const autoAxios = useAutoAxios(axiosInstance, API)
```
api文档
---
```javascript
/**
 * 创建autoAxios实例
 * @param axiosInstance 通过axios.create创建的实列
 * @param openApiJsonDataList openApi配置文件v2链表
 * @return {AutoAxios}
 */
export function useAutoAxios(axiosInstance: axiosInstance, openApiJsonDataList: apiDocs[]): AutoAxios;

/**
 * 发送请求
 * @param url 请求路径
 * @param data 发送数据，不关心位置，自动分配
 * @param tempConfig 覆盖axios的属性，一般不传
 */
autoAxios.sendAxios(url: string, data: object|array, tempConfig: object): Promise<unknown>;

/**
 * 批量发送请求
 * @param {[{url,data,tempConfig}]} arr
 */
autoAxios.sendAll(arr: [{url;data;tempConfig;}]): Promise<any>;

/**
 * 以formData形式发送文件(不入队列)
 */
autoAxios.sendFile(url: string, data: object, tempConfig: object): Promise<any>;
```