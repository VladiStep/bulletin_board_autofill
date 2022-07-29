if (typeof inputEv == "undefined") {
    if (Event.prototype.hasOwnProperty("bubbles")) {
        var focusEv = new Event("focus", {bubbles:true});
        var inputEv = new Event("input", {bubbles:true});
        var changeEv = new Event("change", {bubbles:true});
        var keyDownEv = new Event("keydown", {bubbles:true});
        var keyUpEv = new Event("keyup", {bubbles:true});
        var keyPressEv = new Event("keypress", {bubbles:true});
        var blurEv = new Event("blur", {bubbles:true});
        var closeEv = new Event("close", {bubbles:true});
        var mouseDownEv = new Event("mousedown", {bubbles:true});
        var mouseOverEv = new Event("mouseover", {bubbles:true});
    }
    else
        console.log("[Автозаполнение объявлений] Внимание - данный сайт переопределил системный тип \"Event\", поэтому не получится сымитировать события потери фокуса, ввода текста, и т.п.");
}

fillFields();

async function retrieveFields() {
    let outEntryList = [];
    for (let routine of fieldRoutines) {
        dupWarned = false;
        dupName = undefined;
        subRoutineID = undefined;
        let res = await routine() ?? {};
        outEntryList.push([res, dupWarned, dupName, subRoutineID]);
    }
    
    let outEntry = [{}, false];
    for (let entry of outEntryList) {
        if (Object.keys(entry[0]).length > Object.keys(outEntry[0]).length)
            outEntry = entry;
    }
    if (Object.keys(outEntry[0]).length == 0)
        return;
    
    if (outEntry[1])
        alert(`Внимание - обнаружены 2 или более элементов с именем "${outEntry[2] ?? "*пустое имя*"}".\n` +
              "Есть вероятность неправильного заполнения полей.");
    
    let entryIndex = outEntryList.indexOf(outEntry) + 1;
    let subEntryStr = "";
    if (outEntry[3] != undefined)
        subEntryStr = "." + outEntry[3];

    console.log("[Автозаполнение объявлений] Номер использованного алгоритма - " + entryIndex + subEntryStr);
    
    return outEntry[0];
}

async function fillFields() {
    try {
        if (currentPresetData == undefined || Object.keys(currentPresetData).length == 0) {
            alert("Ошибка - скрипт получил пустые данные.");
            return;
        }
        
        let fields;
        fields = await retrieveFields();
        if (fields == undefined) {
            alert("Структура не распознана - список полей не получен.");
            return;
        }
        
        let scrollPos = window.scrollY;
        let filledFields = [];
        for (let fieldName of Object.keys(fields)) {
            if (fillField(fields[fieldName], currentPresetData[fieldName]))
                filledFields.push(fieldName);
        }
        
        if (filledFields.length == 0)
            alert("Ни одно поле не было заполнено - скорее всего, не введены данные.");
        else
            window.scrollTo(window.scrollX, scrollPos);
        
        return filledFields;
    }
    catch (err) {
        return err.stack;
    }
}
function fillField(field, value, keepPos = false) {
    if (field == undefined) {
        console.log("fillField(): \"field\" is null.");
        return false;
    }
    if (value == undefined || value.length == 0) {
        console.log("fillField(): \"value\" is null or empty.");
        return false;
    }
    if (typeof field == "boolean")
        return field;
    
    let scrollPos;
    if (keepPos)
        scrollPos = window.scrollY;
    
    field.value = value;
    
    field.click();
    if (focusEv != undefined) {
        field.dispatchEvent(focusEv);
        field.dispatchEvent(keyPressEv);
        field.dispatchEvent(keyDownEv);
        field.dispatchEvent(keyUpEv);
        field.dispatchEvent(inputEv);
        field.dispatchEvent(changeEv);
        field.dispatchEvent(blurEv);
    }
    
    if (keepPos)
        window.scrollTo(window.X, scrollPos);
    
    return true;
}