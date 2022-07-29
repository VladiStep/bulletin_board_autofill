const presetsElem = document.getElementById("presets");
const removePresetButton = document.getElementById("removePresetButton");
const typeSelect = document.getElementById("typeSelect");
const fieldsTable = document.getElementById("fieldsTable");
const fieldsElemList = [];
for (let row of fieldsTable.rows)
    fieldsElemList.push(row.children[1].firstElementChild);

Object.defineProperty(Object.prototype, "length", {
    get: function() {
        if (typeof (this.valueOf()) != "object")
            return undefined;
        return Object.keys(this).length;
    }
});
Object.defineProperty(Object.prototype, "keys", {
        get: function() {
            let val = this.valueOf();
            if (typeof val != "object")
                return undefined;
            return Object.keys(val);
    }
});
Object.defineProperty(Object.prototype, "values", {
        get: function() {
            let val = this.valueOf();
            if (typeof val != "object")
                return undefined;
            return Object.values(val);
    }
});

const fieldNames = [
    "fio",
    "contact",
    "phone",
    "email",
    "website",
    "header",
    "text",
    "city",
    "region",
    "address",
    "org",
    "price"
];

for (let b of document.getElementsByTagName("button"))
    b.addEventListener("click", buttonClickHandler);
for (let inp of fieldsElemList)
    inp.addEventListener("blur", fieldBlurHandler);

document.getElementById("phoneField").addEventListener("input", (ev) => { ev.target.setCustomValidity(""); });
typeSelect.addEventListener("change", async (ev) => {
    await modifyPreset("type", ev.target.value);
});
document.getElementById("cont").addEventListener("click", clearFieldsHighlight);


//chrome.storage.local.clear();
chrome.storage.local.get("presets", async (value) => {
    if (value.length > 0) {
        let presets = value["presets"];
        for (let i = 0; i < presets.length; i++)
            presetsElem.options[i] = new Option(presets[i][0]);
        
        if (presetsElem.options.length > 1)
            removePresetButton.disabled = false;
        
        let index = (await chrome.storage.local.get("selectedPresetID"))["selectedPresetID"];
        if (index == undefined) {
            index = 0;
            await chrome.storage.local.set({"selectedPresetID": index});
        }
        presetsElem.selectedIndex = index;
        
        await loadPreset(presets);
    }
    else {
        let entryList = fieldNames.map((f) => { return [f, ""]; }).concat([["type", "face"]]);
        let defaultPreset = ["Набор 1", Object.fromEntries(entryList)];
        chrome.storage.local.set({"presets": {0: defaultPreset},
                                  "selectedPresetID": 0});
    }
    
    presetsElem.addEventListener("change", presetChangeHandler);
});


async function buttonClickHandler() {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab.url.startsWith("chrome://"))
        return;
    
    switch (this.id) {
        case "addPresetButton":
            await addPreset();
            break;
        case "renamePresetButton":
            await renamePreset();
            break;
        case "removePresetButton":
            await removePreset();
            break;
        
        case "enterButton":
            document.body.querySelectorAll("select, button, input, textarea")
                         .forEach(x => x.disabled = true);

            try {
                await onEnterButtonClick(tab.id);
            }
            catch (err) {
                throw err;
            }
            finally {
                document.body.querySelectorAll("select, button, input, textarea")
                             .forEach(x => x.disabled = false);
            }
            break;
    }
}
async function fieldBlurHandler() {
    if (this.id.slice(-5) != "Field")
        return;
    
    let val = this.value;
    
    if (this.type == "tel" && val.length > 0) {
        if (val[0] != "+") {
            val = val.match(/[0-9]/g);
            if (val.length != 11) {
                this.setCustomValidity("Номер должен начинаться с \"+\" и иметь 11 цифр.")
                this.reportValidity();
                return;
            }
            
            val = val.join("");
        }
    }
    
    if (this.reportValidity())
        await modifyPreset(this.id.slice(0, -5), val);
}
async function presetChangeHandler() {
    await chrome.storage.local.set({"selectedPresetID": presetsElem.selectedIndex});
    await loadPreset();
}
async function onEnterButtonClick(tabId) {
    await chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: (data) => { window.currentPresetData = data; },
        args: [(await getCurrentPreset())[1]],
        world: chrome.scripting.ExecutionWorld.MAIN
    });
    let results = await chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ["fieldRoutines.js", "coreScript.js"],
        world: chrome.scripting.ExecutionWorld.MAIN
    });
    
    let filledFields = results[0]["result"];
    if (filledFields == undefined || filledFields.length == 0)
        return;
    if (typeof filledFields == "string") {
        alert("Произошла ошибка. Подробности смотрите в консоли или в \"Управлении расширениями\".");
        throw new Error(filledFields.slice(filledFields.indexOf("Error: ") + 7));
    }
    
    for (let field of fieldsElemList) {
        let filled = filledFields.find((f) => {
            return f == field.id.slice(0, f.length);
        });
        if (filled != undefined)
            field.style.background = "palegreen";
        else
            field.style.background = "lightgray";
    }
}
function clearFieldsHighlight() {
    for (let field of fieldsElemList)
        field.style.background = "";
}

async function getCurrentPreset() {
    let presets = (await chrome.storage.local.get("presets"))["presets"];
    let selIndex = presetsElem.selectedIndex;
    
    return presets[selIndex];
}
async function modifyPreset(field, value) {
    let presets = (await chrome.storage.local.get("presets"))["presets"];
    let selIndex = presetsElem.selectedIndex;
    
    if (presets[selIndex][1][field] == undefined || value == undefined)
        return;
    
    presets[selIndex][1][field] = value;
    
    chrome.storage.local.set({"presets": presets});
}
async function loadPreset() {
    let preset = await getCurrentPreset();
    if (preset == undefined) {
        alert("Ошибка - не найден выбранный набор данных в памяти расширения.");
        return;
    }
    
    for (let fieldName of preset[1].keys) {
        if (fieldName == "type")
            continue;
        
        let field = document.getElementById(fieldName + "Field");
        if (field == undefined) {
            console.log(`Элемент таблицы с ID "${fieldName}Field" не найден.`);
            continue;
        }
        
        field.value = preset[1][fieldName];
    }
    
    typeSelect.value = preset[1]["type"];
}

async function addPreset() {
    let newName = prompt("Введите название нового набора.");
    if (newName == undefined)
        return;
    
    if (newName.replaceAll(" ", "").length == 0) {
        alert("Название не может быть пустым.");
        return;
    }
    
    let selIndex = presetsElem.selectedIndex;
    let newIndex = presetsElem.options.length;
    presetsElem.options.add(new Option(newName));
    presetsElem.selectedIndex = newIndex;
    
    let presets = (await chrome.storage.local.get("presets"))["presets"];
    presets[newIndex] = [newName, presets[selIndex][1]];
    await chrome.storage.local.set({"presets": presets,
                                    "selectedPresetID": newIndex});
    
    removePresetButton.disabled = false;
}
async function renamePreset() {
    let newName = prompt("Введите новое название.", presetsElem.value);
    if (newName == undefined)
        return;
    
    if (newName.replaceAll(" ", "").length == 0) {
        alert("Название не может быть пустым.");
        return;
    }
    
    let selIndex = presetsElem.selectedIndex;
    presetsElem.options[selIndex].text = newName;
    
    let presets = (await chrome.storage.local.get("presets"))["presets"];
    presets[selIndex][0] = newName;
    chrome.storage.local.set({"presets": presets});
}
async function removePreset() {
    let selIndex = presetsElem.selectedIndex;
    if (!confirm(`Удалить набор "${presetsElem.options[selIndex].text}"?`))
        return;
    
    presetsElem.options[selIndex].remove();
    
    let presets = (await chrome.storage.local.get("presets"))["presets"];
    delete presets[selIndex];
    
    let i = selIndex;
    for (let oldKey in presets) {
        if (oldKey < selIndex)
            continue;
        
        // Переименовать ключ
        delete Object.assign(presets, {[i]: presets[oldKey]})[oldKey];
        i++;
    }
    
    let presetsCount = presetsElem.options.length;
    if (selIndex <= presetsCount - 1)
        presetsElem.selectedIndex = selIndex;
    else
        presetsElem.selectedIndex = selIndex - 1;
    
    await chrome.storage.local.set({"presets": presets,
                                    "selectedPresetID": presetsElem.selectedIndex});
    await loadPreset();
    
    if (presetsCount < 2)
        removePresetButton.disabled = true;
}