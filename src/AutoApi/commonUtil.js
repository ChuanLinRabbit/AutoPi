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
        if(typeof tempSchema !== 'object') return tempSchema
        let tempKey = refArray.shift()
        if(tempKey.includes('__')) {
            tempSchema = tempSchema[tempKey.replace('__', '')]
        }else {
            tempSchema = tempSchema[tempKey]
        }
    }
    return tempSchema
}

/**
 * 创建表单数据
 * @param {Object} obj
 * @param {Boolean} [isDeep]
 * @return {FormData}
 */
export function createFormData(obj,isDeep = false) {
    let formData = new FormData()
    for(let key in obj) {
        formData.append(key, obj[key])
    }
    return formData
}