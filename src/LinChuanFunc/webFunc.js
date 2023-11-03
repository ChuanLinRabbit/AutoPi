/**
 * 获取localStorage缓存值
 * @param {string} key 存储在localstorage的键名
 * @returns {string|{}} 如果能通过json转化则返回对象，否则返回原字符串
 */
export function localGet (key = '') {
    const value = window.localStorage.getItem(key)
    try {
        return JSON.parse(window.localStorage.getItem(key))
    } catch (error) {
        return value
    }
}

/**
 * 设定localStorage缓存值
 * @param {string} key 存储在localstorage的键名
 * @param {{}|any} value 可以存储简单对象或者简单类型
 */
export function localSet (key = '', value) {
    window.localStorage.setItem(key, JSON.stringify(value))
}

/**
 * 删除localStorage缓存值
 * @param {string} key 存储在localstorage的键名
 */
export function localRemove (key = '') {
    window.localStorage.removeItem(key)
}

/**
 * 获取sessionStorage缓存值
 * @param {string} key 存储在sessionStorage的键名
 * @returns {string|{}} 如果能通过json转化则返回对象，否则返回原字符串
 */
export function sessionGet (key = '') {
    const value = window.sessionStorage.getItem(key)
    try {
        return JSON.parse(window.sessionStorage.getItem(key))
    } catch (error) {
        return value
    }
}

/**
 * 设定sessionStorage缓存值
 * @param {string} key 存储在sessionStorage的键名
 * @param value 可以存储简单对象或者简单类型
 */
export function sessionSet (key = '', value) {
    window.sessionStorage.setItem(key, JSON.stringify(value))
}

/**
 * 删除sessionStorage缓存值
 * @param {string} key 存储在sessionStorage的键名
 */
export function sessionRemove (key = '') {
    window.sessionStorage.removeItem(key)
}

/**
 * 选择文件
 * @param [acceptType]
 * @return {Promise<[File]>}
 */
export function chooseFile(acceptType = '', multiple) {
    return new Promise((resolve) => {
        let input = document.createElement("input")
        input.type = 'file'
        if(acceptType) input.accept = acceptType
        if(multiple) input.multiple = true
        input.onchange = function () {
            resolve(input.files)
        }
        input.click()
    })
}