// Формат алгоритма - функция, которая должна вернуть словарь (object) cледующего вида:
// {
//     "fio": *элемент поля ФИО*,
//     "phone": *элемент поля номера телефона*
//     "email": *элемент поля электронной почты*
//     ...
// }

function getDictionary(dict, pars) {
    let mode = pars["mode"];
    let skipInvisible = pars["skipInvisible"] ?? true;
    let outDict = {};
    
    if (mode == "inputFields") {
        let inputFields = pars["inputFields"];
        let classList = pars["classList"];
        if (inputFields == undefined) {
            if (classList == undefined)
                throw new Error("getDictionary(): missing \"classList\" (if \"inputFields\" is missing).");
            
            inputFields = getInputFields(classList);
        }
        
        let inputNames = Array.from(inputFields).map((f) => {
            return f.name;
        });
        let values = {};
        for (let i = 0; i < inputNames.length; i++) {
            let value = inputNames[i];
            if (value in values) {
                dupWarned = true;
                dupName = value;
                break;
            }
            values[value] = true;
        }
        
        for (let fieldName of Object.keys(dict)) {
            let inputField = inputFields[dict[fieldName]];
            if (inputField == undefined)
                continue;
            if (skipInvisible && inputField.offsetParent == undefined)
                continue;
            if (!["input", "textarea"].includes(inputField.tagName.toLowerCase()))
                continue;
            
            outDict[fieldName] = inputField;
        }
    }
    else if (mode == "byName") {
        for (let fieldName of Object.keys(dict)) {
            let name = dict[fieldName];
            let elemList = document.getElementsByName(name);
            if (skipInvisible)
                elemList = Array.from(elemList)
                                .filter(e => e.offsetParent != undefined);
            if (elemList.length > 1) {
                dupWarned = true;
                dupName = name;
            }
            
            let inputField = elemList[0];
            if (inputField == undefined)
                continue;
            if (!["input", "textarea"].includes(inputField.tagName.toLowerCase()))
                continue;
            
            outDict[fieldName] = inputField;
        }
    }
    else if (mode == "byClassName") {
        for (let fieldName of Object.keys(dict)) {
            let name = dict[fieldName];
            let elemList = document.getElementsByClassName(name);
            if (skipInvisible)
                elemList = Array.from(elemList)
                                .filter(e => e.offsetParent != undefined);
            if (elemList.length > 1) {
                dupWarned = true;
                dupName = name;
            }
            
            let inputField = elemList[0];
            if (inputField == undefined)
                continue;
            if (!["input", "textarea"].includes(inputField.tagName.toLowerCase()))
                continue;
            
            outDict[fieldName] = inputField;
        }
    }
    else if (mode == "byID") {
        for (let fieldName of Object.keys(dict)) {
            let inputField = document.getElementById(dict[fieldName]);
            if (inputField == undefined)
                continue;
            if (skipInvisible && inputField.offsetParent == undefined)
                continue;
            
            if (!["input", "textarea"].includes(inputField.tagName.toLowerCase()))
                continue;
            
            outDict[fieldName] = inputField;
        }
    }
    
    if (Object.keys(outDict).length == 0)
        return;
    
    return outDict;
}

function getInputFields(selList) {
    let outList;
    
    for (let sel of selList) {
        if (typeof sel == "string" && sel.length > 0) {
            outList = document.getElementsByClassName(sel);
            if (outList.length > 0)
                break;
        }
    }
    
    return outList;
}

function selectOptionByText(sel, optionText, mode) {
    optionText = optionText.toLowerCase();
    if (optionText.length == 0 || sel?.options == undefined)
        return false;
    
    let funcs = [
        (o) => {
            return o.text.toLowerCase() == optionText;
        },
        (o) => {
            return o.text.toLowerCase().includes(optionText);
        }
    ];
    let func;
    if (mode == "contains")
        func = funcs[1];
    else
        func = funcs[0];
    
    let optionValue = Array.from(sel.options).find(func)?.value;
    if (optionValue == undefined)
        return false;
    
    sel.value = optionValue;
    sel.dispatchEvent(changeEv);
    
    return true;
}
function clickItemByText(cont, itemText, mode) {
    itemText = itemText.toLowerCase();
    if (itemText.length == 0 || cont == undefined)
        return false;
    
    let list;
    if (Symbol.iterator in cont)
        list = cont;
    else {
        list = cont.children;
        if (list == undefined)
            return false;
    }
    
    let funcs = [
        (o) => {
            return o.innerText.toLowerCase() == itemText;
        },
        (o) => {
            return o.innerText.toLowerCase().includes(itemText);
        }
    ];
    let func;
    if (mode == "contains")
        func = funcs[1];
    else
        func = funcs[0];
    
    let item = Array.from(list).find(func);
    if (item == undefined)
        return false;
    
    if (mode == "hover")
        item.dispatchEvent(mouseOverEv);
    item.click();
    
    return true;
}

function onTimeout(msg, obs) {
    let reason = "превышено время ожидания загрузки.";
    if (obs.takeRecords().length > 0)
        reason = "\"MutationObserver\" не отвечает.\nПереоткройте вкладку.";
    alert(msg + " - " + reason);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


if (typeof fieldRoutines == "undefined") {
    const OBS_CONF_LIST = {
        attributes: false,
        childList: true,
        subtree: false
    };
    const OBS_CONF_ATTR = {
        attributes: true
    };
    
    var dupWarned = false;
    var dupName, subRoutineID;
    
    var fieldRoutines = [
    /*
        () => {
            let dict = {
                "fio": "fio",
                "contact": "contact",
                "phone": "phone",
                "email": "email",
                "website": "url",
                "header": "title",
                "text": "text",
                "city": "city",
                "region": "region",
                "address": "address",
                "org": "org",
                "price": "price"
            };

            let outDict = getDictionary(dict, { "mode": "byID" });
            if (outDict == undefined)
                return;
            
            if (Object.keys(outDict).length != Object.keys(dict).length)
                return outDict;
            
            
            
            return outDict;
        }
    */
        // 1. class="w400"; class="input450"; class="textfield"
        () => {
            let selList = ["w400", "input450", "textfield"];
            let inputFields = getInputFields(selList);
            if (inputFields.length == 0)
                return;
            
            let dictList = [
                // "w400"
                {
                    "fio": "FIO",
                    "phone": "phone",
                    "email": "mail",
                    "website": "url",
                    "header": "title",
                    "text": "text_mess"
                },
                {
                    "fio": "people",
                    "phone": "phone",
                    "email": "mail",
                    "website": "www",
                    "header": "title",
                    "text": "text",
                    "city": "city",
                    "org": "org"
                },
                {
                    "fio": "FIO",
                    "phone": "phone",
                    "email": "mail",
                    "header": "title",
                    "text": "text_mess",
                    "city": "city",
                    "org": "company"
                },
                // "input450"
                { 
                    "fio": "contact",
                    "phone": "phone",
                    "email": "email",
                    "website": "url",
                    "header": "title",
                    "text": "adver",
                    "address": "address",
                    "price": "price"
                }
            ];
            
            let pars = {
                "mode": "inputFields",
                "inputFields": inputFields
            }
            let outDict;
            let outEntryList = [];
            let i = 0;
            let entryIndex = 0;
            for (let dict of dictList) {
                i++;

                dupWarned = false;
                dupName = undefined;
                outDict = getDictionary(dict, pars) ?? {};
                
                if (Object.keys(outDict).length == Object.keys(dict).length) {
                    entryIndex = i;
                    outEntryList.length = 0;
                    break;
                }
                
                outEntryList.push([outDict, dupWarned, dupName]);
            }
            
            let outEntry;
            if (outEntryList.length == 0)
                outEntry = [outDict, dupWarned, dupName];
            else {
                outEntry = [{}, false];
                i = 0;
                for (let entry of outEntryList) {
                    i++;

                    if (Object.keys(entry[0]).length > Object.keys(outEntry[0]).length) {
                        entryIndex = i;
                        outEntry = entry;
                    }
                }
            }
            
            if (Object.keys(outEntry[0]).length == 0)
                return;
            
            dupWarned = outEntry[1];
            dupName = outEntry[2];
            subRoutineID = entryIndex;
            return outEntry[0];
        },
        
        // 2. class="100p"
        () => {
            let inputFields = document.getElementsByClassName("100p");
            if (inputFields.length == 0)
                return;
            
            let dict = {
                "fio": "fio",
                "contact": "contact",
                "email": "email",
                "website": "url",
                "header": "capt",
                "text": "text",
            };
            
            let pars = {
                "mode": "inputFields",
                "inputFields": inputFields
            };
            let outDict = getDictionary(dict, pars);
            if (outDict == undefined)
                return;
            
            let citySelect = inputFields["town_id"];
            if (citySelect == undefined)
                return outDict;
            
            if (!selectOptionByText(citySelect, currentPresetData["city"]))
                alert("Поле \"Город\" не заполнено - указанного города нет в списке сайта.");
            else
                outDict["city"] = true;
            
            return outDict;
        },
        
        // 3. class="form_text"; div id="add_ann_form"; class="c"; form class="ifrm"
        () => {
            let entryList = [
                // "form_text"
                [
                    "byName",
                    {
                        "fio": "contact",
                        "phone": "phone",
                        "email": "email",
                        "website": "url",
                        "header": "title",
                        "text": "adver",
                        "address": "address",
                        "price": "price"
                    }
                ],
                // "add_ann_form"
                [
                    "byID",
                    {
                        "fio": "id_username",
                        "phone": "id_phone",
                        "email": "id_email",
                        "header": "id_name",
                        "text": "id_body"
                    }
                ],
                // "c"
                [
                    "byName",
                    {
                        "fio": "PERSON",
                        "phone": "PHONE",
                        "email": "MAIL",
                        "website": "URL",
                        "header": "TITLE",
                        "text": "FULL",
                        "city": "CITY",
                        "price": "COST"
                    }
                ],
                // "ifrm"
                [
                    "byName",
                    {
                        "fio": "lead_contact_person",
                        "phone": "lead_phone",
                        "email": "lead_email",
                        "website": "lead_url",
                        "header": "lead_title",
                        "text": "lead_content",
                        "city": "lead_city",
                        "address": "lead_address",
                        "org": "lead_company",
                        "price": "lead_price"
                    }
                ]
            ];
            
            let outDict;
            let outEntryList = [];
            let i = 0;
            let entryIndex = 0;
            let pars = { "mode": "" };
            for (let entry of entryList) {
                i++;

                dupWarned = false;
                dupName = undefined;
                pars["mode"] = entry[0];
                let dict = entry[1];
                
                outDict = getDictionary(dict, pars) ?? {};
                if (Object.keys(outDict).length == Object.keys(dict).length) {
                    entryIndex = i;
                    outEntryList.length = 0;
                    break;
                }
                
                outEntryList.push([outDict, dupWarned, dupName]);
            }
            
            let outEntry;
            if (outEntryList.length == 0)
                outEntry = [outDict, dupWarned, dupName];
            else {
                outEntry = [{}, false];
                
                i = 0;
                for (let entry of outEntryList) {
                    i++;

                    if (Object.keys(entry[0]).length > Object.keys(outEntry[0]).length) {
                        entryIndex = i;
                        outEntry = entry;
                    }
                }
            }
            
            if (Object.keys(outEntry[0]).length == 0)
                return;
            
            dupWarned = outEntry[1];
            dupName = outEntry[2];
            subRoutineID = entryIndex;
            
            return outEntry[0];
        },
        
        // 4. class="text_pole_create_advert"; class="input-form"
        async () => {
            let dict = {
                "fio": "name_user",
                "phone": "telefon",
                "email": "email",
                "website": "site",
                "header": "name_adv",
                "text": "text_adv",
                "price": "cost"
            };
            
            let outDict = getDictionary(dict, { "mode": "byName" });
            if (outDict == undefined)
                return;
            
            // "сландо.su"
            if (document.location.host == "xn--80aitjgn.su" && dupName == "name_user") {
                dupWarned = false;
                dupName == undefined;
            }
            
            if (Object.keys(outDict).length != Object.keys(dict).length)
                return outDict;
            
            let countrySel = document.getElementsByName("country_adv")[0];
            if (countrySel == undefined || !selectOptionByText(countrySel, "Россия"))
                return outDict;
            
            let prevTime;
            let regionsLoaded = false;
            let citiesLoaded = false;
            let disabled = false;
            let observer = new MutationObserver((mutations, obs) => {
                if (mutations[0].attributeName == "disabled")
                    disabled = true;
            });
            
            let regionSel = document.getElementsByName("region_adv")[0];
            if (regionSel == undefined)
                return outDict;
            
            prevTime = Date.now();
            observer.observe(regionSel, OBS_CONF_ATTR);
            while (true) {
                if (Date.now() - prevTime > 4000) {
                    onTimeout("Поля \"Регион\" и \"Город\" не заполнены", observer);
                    break;
                }
                
                if (disabled) {
                    regionsLoaded = true;
                    disabled = false;
                    break;
                }
                
                await sleep(100);
            }
            observer.disconnect();
            if (!regionsLoaded)
                return outDict;
            
            if (!selectOptionByText(regionSel, currentPresetData["region"], "contains")) {
                alert("Поля \"Регион\" и \"Город\" не заполнены - указанного региона нет в списке сайта.");
                return outDict;
            }
            outDict["region"] = true;
            
            let citySel = document.getElementsByName("city_adv")[0];
            if (citySel == undefined)
                return outDict;
            
            prevTime = Date.now();
            observer.observe(citySel, OBS_CONF_ATTR);
            while (true) {
                if (Date.now() - prevTime > 4000) {
                    onTimeout("Поле \"Город\" не заполнено", observer);
                    break;
                }
                
                if (disabled) {
                    citiesLoaded = true;
                    disabled = false;
                    break;
                }
                
                await sleep(100);
            }
            observer.disconnect();
            if (!citiesLoaded)
                return outDict;
            
            if (!selectOptionByText(citySel, currentPresetData["city"])) {
                alert("Поле \"Город\" не заполнено - указанного города нет в списке сайта.");
                return outDict;
            }
            outDict["city"] = true;
            
            return outDict;
        },
        
        // 5. class="textfield"
        async () => {
            let dict = {
                "fio": "messages_face",
                "phone": "messages_phone",
                "email": "messages_email",
                "header": "messages_name",
                "text": "messages_description",
                "price": "messages_price",
                "address": "messages_address"
            };
            
            let formBlocks = document.getElementsByClassName("js_formBlocks")[0];
            if (formBlocks?.getElementsByClassName("noleaf").length > 0) // Если поля не видны
                return;
                
            let loadPopup = document.getElementById("ajaxLoad");
            
            let cityField = document.getElementById("messages_id_city_text");
            let cityName = currentPresetData["city"];
            
            let isCitySelected = false;            
            if (loadPopup != undefined && cityField != undefined && cityName != undefined) {
                let isValidCity = true;
                let observer = new MutationObserver((mutations, obs) => {
                    let cityOption = mutations[0].addedNodes[0];
                    if (cityOption == undefined
                        || cityOption.childNodes[0]?.textContent.toLowerCase() != cityName.toLowerCase()) {
                        isValidCity = false;
                        return;
                    }
                    
                    cityOption.click();
                });
                let loadObserver = new MutationObserver((mutations, obs) => {
                    let elem = mutations[0].target;
                    if (mutations[0].attributeName == "style" && elem.style.display == "none")
                        isCitySelected = true;
                });
                
                let autoCompList = document.getElementsByClassName("ui-autocomplete");
                for (let autoCompUl of autoCompList)
                    observer.observe(autoCompUl, OBS_CONF_LIST);
                loadObserver.observe(loadPopup, OBS_CONF_ATTR);
                
                let scrollPos = window.scrollY;
                
                cityField.value = cityName;
                cityField.dispatchEvent(inputEv);
                
                let prevTime = Date.now();
                while (!isCitySelected) {
                    if (Date.now() - prevTime > 4000) {
                        alert("Поле \"Город\" не заполнено - указанного города нет в списке сайта, или проблема с соединением.");
                        break;
                    }
                    if (!isValidCity) {
                        alert("Поле \"Город\" не заполнено - указанного города нет в списке сайта.");
                        break;
                    }
                    
                    await sleep(100);
                }
                
                window.scrollTo(window.scrollX, scrollPos);
                observer.disconnect();
                loadObserver.disconnect();
                
                await sleep(200);
            }
            
            let outDict = getDictionary(dict, { "mode": "byID" });
            if (outDict == undefined)
                return;
            
            if (isCitySelected)
                outDict["city"] = true;
            
            return outDict;
        },
        
        // 6. class="required"
        () => {
            let dict = {
                "fio": "user-name",
                "email": "reg-email",
                "header": "title",
                "text": "description",
                "address": "address",
                "price": "flt_price"
            };
            
            let outDict = getDictionary(dict, { "mode": "byName" });
            if (outDict == undefined)
                return;
            
            if (Object.keys(outDict).length != Object.keys(dict).length)
                return outDict;
            
            let typeButtons = document.getElementsByClassName("label-user");
            if (typeButtons.length == 2) {
                if (currentPresetData["type"] == "face")
                    typeButtons[0].click();
                else
                    typeButtons[1].click();
                
                outDict["type"] = true;
            }
            
            let phoneField = document.getElementsByName("reg-phone")[0];
            let phone = currentPresetData["phone"];
            if (phoneField != undefined && fillField(phoneField, phone.slice(2), true))
                outDict["phone"] = true;
                    
            return outDict;
        },
        
        // 7. onchange="formedited()"; class="form-data-cell"
        () => {
            let entryList = [
                // "formedited()"
                [
                    "city",
                    {
                        "fio": "name",
                        "phone": "phone",
                        "email": "email",
                        "website": "url",
                        "header": "title",
                        "text": "text",
                        "price": "price"
                    }
                ],
                // "form-data-cell"
                [
                    "CitySelectorId",
                    {
                        "fio": "UserName",
                        "phone": "UserPhone",
                        "email": "UserEmail",
                        "website": "Url",
                        "header": "Header",
                        "text": "Comment",
                        "price": "Price"
                    }
                ]
            ];
            
            let outDict;
            for (let entry of entryList) {
                let dict = getDictionary(entry[1], { "mode": "byName" });
                if (dict == undefined)
                    continue;
                
                if (Object.keys(dict).length != Object.keys(entry[1]).length)
                    continue;
                
                let citySelect = document.getElementById(entry[0]);
                if (citySelect == undefined)
                    continue;
                
                if (!selectOptionByText(citySelect, currentPresetData["city"]))
                    alert("Поле \"Город\" не заполнено - указанного города нет в списке сайта.");
                else
                    dict["city"] = true;
                
                outDict = dict;
                break;
            }
            
            return outDict;
        },
        
        // 8. class="text"
        async () => {
            let dict = {
                "fio": "AInfoForm_contact_person",
                "phone": "AInfoForm_phone",
                "email": "Users_email",
                "website": "ExternalUrl",
                "header": "AInfoForm_title",
                "text": "AInfoForm_content",
                "address": "AInfoForm_address",
                "price": "AInfoForm_price"
            };
            
            let outDict = getDictionary(dict, { "mode": "byID", "skipInvisible": false });
            if (outDict == undefined)
                return;
            
            if (Object.keys(outDict).length != Object.keys(dict).length)
                return outDict;
            
            let regionButton = document.getElementById("Region-button");
            let regionMenu = document.getElementById("Region-menu");
            let selectedRegion = document.getElementById("Region")?.selectedOptions[0]?.text;
            let cityMenu = document.getElementById("Geo-menu");
            if (regionButton == undefined || regionMenu == undefined || cityMenu == undefined)
                return outDict;
            
            regionButton.click();
            regionButton.click();
            
            let region = currentPresetData["region"].toLowerCase();
            let regionElem = Array.from(regionMenu.children).find((e) => {
                return e.innerText.toLowerCase().includes(region);
            });
            if (regionElem == undefined) {
                alert("Поля \"Регион\" и \"Город\" не заполнены - указанного региона нет в списке сайта.");
                return outDict;
            }
            outDict["region"] = true;

            if (!regionElem.innerText.toLowerCase().includes(selectedRegion.toLowerCase())) {
                let prevTime;
                let citiesLoaded = false;
                let observer = new MutationObserver((mutations, obs) => {
                    if (mutations.slice(-1)[0].addedNodes.length > 0)
                        citiesLoaded = true;
                });
                regionElem.dispatchEvent(mouseOverEv);
                regionElem.click();
                
                observer.observe(cityMenu, OBS_CONF_LIST);
    
                prevTime = Date.now();
                while (!citiesLoaded) {
                    if (Date.now() - prevTime > 4000) {
                        onTimeout("Поля \"Регион\" и \"Город\" не заполнены", observer);
                        break;
                    }
                    
                    await sleep(100);
                }

                observer.disconnect();

                if (!citiesLoaded)
                    return outDict;
            }

            if (!clickItemByText(cityMenu, currentPresetData["city"], "hover")) {
                alert("Поле \"Город\" не заполнено - указанного города нет в списке сайта.");
                return outDict;
            }
            outDict["city"] = true;
            
            return outDict;
        },
        
        // 9. span class="ttp"
        async () => {
            let dict = {
                "email": "mail",
                "header": "sbj",
                "text": "txt",
                "address": "adr"
            };
            
            let outDict = getDictionary(dict, { "mode": "byName" });
            if (outDict == undefined)
                return;
            if (Object.keys(outDict).length != Object.keys(dict).length)
                return outDict;
            
            dict = {};
            
            let typeRadios = document.getElementsByName("ptp");
            if (typeRadios.length == 2) {
                if (currentPresetData["type"] == "face") {
                    dict["fio"] = "name";
                    typeRadios[0].click();
                }
                else {
                    dict["org"] = "cname";
                    typeRadios[1].click();
                }
                
                outDict["type"] = true;
            }
            let outDict1 = getDictionary(dict, { "mode": "byName" });
            if (outDict1 == undefined)
                return;
            
            outDict = {...outDict, ...outDict1};

            
            let phoneCodeField = document.getElementById("phcd");
            let phoneField = document.getElementById("phn");
            let phone = currentPresetData["phone"];
            if (phoneCodeField != undefined && phoneField != undefined
                && fillField(phoneCodeField, phone.slice(0, 2), true) && fillField(phoneField, phone.slice(2), true))
                outDict["phone"] = true;
            
            let cityButtonCont = document.getElementById("rtd");
            if (cityButtonCont == undefined)
                return outDict;
            
            let cityButton = cityButtonCont.children[0];
            if (!(cityButton instanceof HTMLAnchorElement))
                return outDict;
            
            let popup = document.getElementById("view");
            if (popup == undefined)
                return outDict;
            
            let loaded = false;
            let observer = new MutationObserver((mutations, obs) => {
                if (mutations.at(-1).addedNodes.length > 0)
                    loaded = true;
            });

            observer.observe(popup, OBS_CONF_LIST);
            cityButton.click();

            let prevTime = Date.now();
            while (!loaded) {
                if (Date.now() - prevTime > 4000) {
                    onTimeout("Поле \"Город\" не заполнено", observer);
                    break;
                }
                
                await sleep(100);
            }

            observer.disconnect();

            if (!loaded)
                return outDict;
            
            let cityField = document.getElementById("sr");
            let citySearchButton = document.getElementById("sgo");
            if (cityField == undefined || citySearchButton == undefined)
                return outDict;

            observer.observe(popup, OBS_CONF_LIST);

            cityField.value = currentPresetData["city"];
            citySearchButton.click();

            loaded = false;
            prevTime = Date.now();
            while (!loaded) {
                if (Date.now() - prevTime > 4000) {
                    onTimeout("Поле \"Город\" не заполнено", observer);
                    break;
                }
                
                await sleep(100);
            }

            observer.disconnect();

            let popupCloseButton = document.getElementById("sgo")?.parentElement.parentElement
                                           .getElementsByClassName("stp")[0]

            if (!loaded) {
                popupCloseButton?.click();
                return outDict;
            }

            let cityListCont = popup.getElementsByClassName("mt")[0];
            if (cityListCont == undefined)
                return outDict;
            
            cityListCont = cityListCont.firstElementChild;
            if (!(cityListCont instanceof HTMLTableElement)) {
                alert("Поле \"Город\" не заполнено - указанного города нет в списке сайта.");
                popupCloseButton?.click();
                return outDict;
            }
            
            let cityList = cityListCont.getElementsByTagName("input");
            if (cityList.length == 0)
                return outDict;
            
            let city = currentPresetData["city"].toLowerCase();
            let cityElem = Array.from(cityList).find(c => {
                let text = c.labels[0]?.innerText.toLowerCase().split(" \\ ").at(-1);
                return text == city;
            });

            if (cityElem == undefined) {
                alert("Поле \"Город\" не заполнено - указанного города нет в списке сайта.");
                popupCloseButton?.click();
                return outDict;
            }
            cityElem.click();
            cityListCont.nextElementSibling?.getElementsByTagName("a")[0]?.click();
            popupCloseButton?.click();

            outDict["city"] = true;
            
            return outDict;
        },
        
        // 10. class="ads-create-input"
        () => {
            let dict = {
                "fio": "MyName",
                "phone": "mobila",
                "email": "Email",
                "website": "myurla",
                "header": "param1",
                "text": "Text",
                "price": "mycena"
            };
            
            let outDict = getDictionary(dict, { "mode": "byName" });
            if (outDict == undefined)
                return;
            
            let cityElemList = document.getElementsByName("MoyGorod");
            if (cityElemList.length > 1) {
                dupWarned = true;
                dupName = "MoyGorod";
            }
            let citySelect = cityElemList[0];
            if (citySelect == undefined)
                return outDict;
            
            if (!selectOptionByText(citySelect, currentPresetData["city"]))
                alert("Поле \"Город\" не заполнено - указанного города нет в списке сайта.");
            else
                outDict["city"] = true;
            
            return outDict;
        },
        
        // 11. id="j-i-..."
        async () => {
            let dict = {
                "fio": "name",
                "phone": "phones[1]",
                "email": "email",
                "header": "title",
                "text": "descr",
                "address": "addr_addr",
                "price": "price"
            };
            
            let outDict = getDictionary(dict, { "mode": "byName" });
            if (outDict == undefined)
                return;
            
            let countrySel = document.getElementsByName("reg1_country")[0];
            if (countrySel != undefined) {
                if (!selectOptionByText(countrySel, "Россия"))
                    return outDict;
                await sleep(150);
            }

            let cityInput = document.getElementsByClassName("j-geo-city-select-ac")[0];
            if (cityInput?.offsetParent == undefined)
                return outDict;
            let cityListCont = cityInput.parentElement.getElementsByClassName("autocomplete")[0];
            if (cityListCont == undefined)
                return outDict;
            
            let citiesLoaded = false;
            let observer = new MutationObserver((mutations, obs) => {
                if (mutations.at(-1).attributeName == "style"
                    && cityListCont.style.display == "block")
                    citiesLoaded = true;
            });

            let city = currentPresetData["city"].toLowerCase();
            cityInput.value = city;
            cityInput.dispatchEvent(keyUpEv);

            observer.observe(cityListCont, OBS_CONF_ATTR);
            
            let prevTime = Date.now();
            while (!citiesLoaded) {
                if (Date.now() - prevTime > 4000) {
                    onTimeout("Поле \"Город\" не заполнено", observer);
                    break;
                }
                
                await sleep(100);
            }
            observer.disconnect();

            if (!citiesLoaded)
                return outDict;

            let cityElem = Array.from(cityListCont.children)
                           .find(e => e.getElementsByTagName("strong")[0]?.innerText.toLowerCase() == city);
            if (cityElem == undefined) {
                alert("Поле \"Город\" не заполнено - указанного города нет в списке сайта.");
                return outDict;
            }
            cityElem.dispatchEvent(mouseDownEv);
            outDict["city"] = true;
                    
            return outDict;
        },
        
        // 12. class="form_line"
        async () => {
            let dict = {
                "fio": "fio",
                "website": "url",
                "header": "title",
                "text": "text",
                "address": "address",
                "price": "price"
            };
            
            let outDict = getDictionary(dict, { "mode": "byName" });
            if (outDict == undefined)
                return;
            
            if (Object.keys(outDict).length != Object.keys(dict).length)
                return outDict;
            
            let regionListCont = document.getElementById("dialog-region");
            if (regionListCont != undefined) {
                let regionList = regionListCont.getElementsByTagName("a");
                let region = currentPresetData["region"];
                
                if (clickItemByText(regionList, region, "contains")) {
                    let cityListCont = document.getElementById("dialog-city");
                    let cityListButton = cityListCont?.previousSibling?.getElementsByClassName("ui-icon-closethick")[0];
                    if (cityListCont != undefined && cityListButton != undefined) {
                        let citiesLoaded = false;
                        let observer = new MutationObserver((mutations, obs) => {
                            for (let mutation of mutations) {
                                for (let added of mutation.addedNodes) {
                                    if (added.id == "citys_popup_block") {
                                        citiesLoaded = true;
                                        break;
                                    }
                                }
                            }
                        });
                        
                        observer.observe(cityListCont, OBS_CONF_LIST);
                        
                        let prevTime = Date.now();
                        while (!citiesLoaded) {
                            if (Date.now() - prevTime > 4000) {
                                onTimeout("Поле \"Город\" не заполнено", observer);
                                break;
                            }
                            
                            await sleep(100);
                        }
                        
                        observer.disconnect();
                        
                        if (citiesLoaded) {
                            let cityList = cityListCont.getElementsByTagName("a");
                            let city = currentPresetData["city"];
                            
                            if (clickItemByText(cityList, city)) {
                                outDict["region"] = true;
                                outDict["city"] = true;
                            }
                            else {
                                alert("Поле \"Город\" не заполнено - указанного города нет в списке сайта.");
                                cityListButton.click();
                            }
                        }
                        else
                            cityListButton.click();
                    }
                }
                else
                    alert("Поле \"Город\" не заполнено - указанного региона нет в списке сайта.");
            }
            
            let phoneField = document.getElementsByName("phoneOther")[0];
            let phone = currentPresetData["phone"];
            if (phoneField != undefined && fillField(phoneField, phone.slice(2), true))
                outDict["phone"] = true;
            
            return outDict;
        },
        
        // 13. class="input_field"
        async () => {
            let dict = {
                "phone": "user_phone",
                "email": "user_email",
                "website": "user_site",
                "header": "caption_text",
                "text": "post_text",
                "price": "price"
            };
            
            let typeFilled = false;
            let typeRadios = document.getElementsByName("userType");
            if (typeRadios.length == 2) {
                if (currentPresetData["type"] == "face") {
                    dict["fio"] = "user_name";
                    typeRadios[0].click();
                }
                else {
                    dict["org"] = "user_name";
                    typeRadios[1].click();
                }
                
                typeFilled = true;
            }
            
            let outDict = getDictionary(dict, { "mode": "byName" });
            if (outDict == undefined)
                return;
            
            if (typeFilled)
                outDict["type"] = true;
            
            let cityElem = document.getElementById("js-cc");
            if (cityElem == undefined)
                return outDict;
            
            cityElem.click();
            
            let cityListCont = document.getElementsByClassName("cs-popup-window__inner")[0];
            if (cityListCont == undefined)
                return outDict;

            if (cityListCont.getElementsByClassName("js-choose-city").length == 0) {
                let citiesLoaded = false;
                let observer = new MutationObserver((mutations, obs) => {
                    for (let added of mutations[0].addedNodes) {
                        if (added.className == "js-choose-city") {
                            citiesLoaded = true;
                            break;
                        }
                    }
                });
                
                observer.observe(cityListCont, OBS_CONF_LIST);
                
                let prevTime = Date.now();
                while (!citiesLoaded) {
                    if (Date.now() - prevTime > 4000) {
                        alert("Поле \"Город\" не заполнено - список городов не открылся.");
                        break;
                    }
                    
                    await sleep(100);
                }
                
                observer.disconnect();
                
                if (!citiesLoaded)
                    return outDict;
            }
            
            let cityName = currentPresetData["city"];
            let cityList = cityListCont.querySelectorAll("a[id^=city_]");
            
            if (!clickItemByText(cityList, cityName)) {
                alert("Поле \"Город\" не заполнено - указанного города нет в списке сайта.");
                
                let par = cityListCont.parentElement;
                par?.getElementsByClassName("cs-popup-window__close")[0]?.click();
                
                return outDict;
            }
            
            outDict["city"] = true;
            
            return outDict;
        },
        
        // 14. class="cs-text"
        async () => {
            let dictParts = [
                {
                    "header": "fm20pl406",
                    "text": "fm20pl408",
                    "price": "fm20pl418"
                },
                {
                    "fio": "username",
                    "email": "useremail",
                    "phone": "userphone",
                    "website": "usersite"
                }
            ];
            
            let outDict;
            let valid = false;
            let pars = { "mode": "byID" };
            for (let part of dictParts) {
                outDict = getDictionary(part, pars) ?? {};
                
                if (Object.keys(outDict).length == Object.keys(part).length) {
                    valid = true;
                    break;
                }
            }
            
            if (!valid)
                return;
            
            let cityElem = document.getElementsByClassName("ae-city")[0];
            if (cityElem != undefined) {
                let cityListCont;
                let cityListContList = document.getElementsByClassName("cs-popup-window__inner-wrapper");
                if (cityListContList.length > 0) {
                    for (let cont of cityListContList) {
                        cityListCont = cont.getElementsByClassName("ccd__list")[0];
                        if (cityListCont != undefined)
                            break;
                    }
                    
                    if (cityListCont == undefined) {
                        let observer = new MutationObserver((mutations, obs) => {
                            for (let added of mutations[0].addedNodes) {
                                if (added.className == "ccd") {
                                    cityListCont = added;
                                    break;
                                }
                            }
                        });
                        
                        cityElem.click();
                        
                        for (let cont of cityListContList)
                            observer.observe(cont, OBS_CONF_LIST);
                        
                        let prevTime = Date.now();
                        while (cityListCont == undefined) {
                            if (Date.now() - prevTime > 4000) {
                                alert("Поле \"Город\" не заполнено - список городов не открылся.");
                                break;
                            }
                            
                            await sleep(100);
                        }
                        
                        observer.disconnect();
                        
                        if (cityListCont == undefined)
                            return outDict;
                        
                        cityListCont = cityListCont.getElementsByClassName("ccd__list")[0];
                        if (cityListCont == undefined)
                            return outDict;
                    }
                }
                
                if (cityListCont != undefined) {
                    let cityName = currentPresetData["city"];
                    let cityList = cityListCont.getElementsByTagName("a");
                    
                    if (!clickItemByText(cityList, cityName)) {
                        alert("Поле \"Город\" не заполнено - указанного города нет в списке сайта.");
                        //                     ccd            wrapper        _inner         cs-popup-window
                        let par = cityListCont.parentElement?.parentElement?.parentElement?.parentElement;
                        par?.getElementsByClassName("cs-popup-window__close")[0]?.click();
                        
                        return outDict;
                    }
                    
                    outDict["city"] = true;
                }
            }
            
            return outDict;
        },
        
        // 15. div class="js-reactSubmission"
        () => {
            let dict = {
                "text": "text",
                "price": "price"
            };
            
            let outDict = getDictionary(dict, { "mode": "byID" });
            if (outDict == undefined)
                return;
            
            let qa = Object.values(outDict)[0].dataset["qa"];
            if (qa == undefined)
                return outDict;
            if (!["submission", "field"].every(s => qa.includes(s)))
                return outDict;

            for (let fieldName of Object.keys(outDict)) {
                let field = outDict[fieldName];
                let value = currentPresetData[fieldName];

                field.value = value;
                field.dispatchEvent(inputEv);
                field.dispatchEvent(blurEv);
            }
            
            outDict = {
                "text": true,
                "price": true,
                "header": false,
                "fio": false,
                "contact": false,
                "website": false,
                "city": false,
                "region": false,
                "address": false,
                "org": false
            };

            return outDict;
        },

        // 16. class="input-line"
        () => {
            let dict = {
                "fio": "Classifieds_ads_user_name",
                "phone": "Classifieds_phone",
                "email": "user_email",
                "header": "mess-title",
                "text": "mess-desc",
                "price": "price-advert"
            };
            
            let outDict = getDictionary(dict, { "mode": "byID" });
            if (outDict == undefined)
                return;
            
            if (Object.keys(outDict).length != Object.keys(dict).length)
                return outDict;
            
            let regionSelect = document.getElementById("regionSel_add");
            if (regionSelect != undefined
                && !selectOptionByText(regionSelect, currentPresetData["region"], "contains"))
                alert("Поле \"Регион\" не заполнено - указанного региона нет в списке сайта.");
            else
                outDict["region"] = true;
            
            let typeSpan = document.getElementById("Classifieds_fiz_ur");
            if (typeSpan == undefined)
                return outDict;
            let typeRadios = typeSpan.getElementsByTagName("input");
            if (typeRadios.length != 2)
                return outDict;
            
            if (currentPresetData["type"] == "face")
                typeRadios[0].click();
            else
                typeRadios[1].click();
            outDict["type"] = true;
            
            return outDict;
        },
        
        // 17. class="field_input_text"
        async () => {
            let dict = {
                "email": "fld_email",
                "header": "fld_title",
                "text": "fld_description",
                "price": "fld_price"
            };
            
            let outDict = getDictionary(dict, { "mode": "byID" });
            if (outDict == undefined)
                return;
            if (Object.keys(outDict).length != Object.keys(dict).length)
                return outDict;
            
            dict = {};
            let typeRadios = document.getElementsByName("type_user");
            if (typeRadios.length == 2) {
                if (currentPresetData["type"] == "face") {
                    dict["fio"] = "fld_name_user";
                    typeRadios[0].click();
                }
                else {
                    dict["org"] = "fld_name_user";
                    typeRadios[1].click();
                }
                
                outDict["type"] = true;
            }
            let outDict1 = getDictionary(dict, { "mode": "byID" });
            if (outDict1 == undefined)
                return;
            
            outDict = {...outDict, ...outDict1};
            
            
            let phoneField = document.getElementById("fld_phone");
            let phone = currentPresetData["phone"].replaceAll(/ |-/g, "");
            if (phone.slice(0, 2) == "+7") {
                if (phoneField != undefined && fillField(phoneField, "8" + phone.slice(2), true))
                    outDict["phone"] = true;
            }
            else
                alert("Поле \"Номер телефона\" не заполнено - данный сайт поддерживает только российские номера (формат - 8XXXXXXXXXX).");
            
            
            let regionSel = document.getElementById("id_region");
            if (regionSel == undefined)
                return outDict;
            
            if (!selectOptionByText(regionSel, currentPresetData["region"], "contains")) {
                alert("Поля \"Регион\" и \"Город\" не заполнены - указанного региона нет в списке сайта.");
                return outDict;
            }
            outDict["region"] = true;
            
            let citySel = document.getElementById("city");
            if (citySel == undefined)
                return outDict;
            
            let prevTime = Date.now();
            let disabled = false;
            let citiesLoaded = false;
            let observer = new MutationObserver((mutations, obs) => {
                if (mutations[0].attributeName == "disabled")
                    disabled = true;
            });
            
            observer.observe(citySel, OBS_CONF_ATTR);
            while (true) {
                if (Date.now() - prevTime > 4000) {
                    onTimeout("Поле \"Город\" не заполнено", observer);
                    break;
                }
                
                if (disabled) {
                    citiesLoaded = true;
                    disabled = false;
                    break;
                }
                
                await sleep(100);
            }
            observer.disconnect();
            if (!citiesLoaded)
                return outDict;
            
            if (!selectOptionByText(citySel, currentPresetData["city"])) {
                alert("Поле \"Город\" не заполнено - указанного города нет в списке сайта.");
                return outDict;
            }
            outDict["city"] = true;
            
            return outDict;
        },
        
        // 18. class="bzr-form-control"
        async () => {
            let dict = {
                "phone": "contacts[contactInfo]",
                "header": "subject",
                "text": "text",
                "address": "pickupAddress",
                "price": "price"
            };
            
            let outDict = getDictionary(dict, { "mode": "byName" });
            if (outDict == undefined)
                return;
            if (Object.keys(outDict).length < 4)
                return outDict;
            
            let popup;
            let observer = new MutationObserver((mutations, obs) => {
                for (let mutation of mutations) {
                    for (let node of mutation.addedNodes) {
                        if (node.id == "popupContainer") {
                            popup = node;
                            break;
                        }
                    }
                }
            });
            
            let cityButton = Array.from(document.getElementsByClassName("button")).find((b) => {
                return b.dataset["action"] == "choose-city";
            });
            if (cityButton == undefined)
                return outDict;
            
            cityButton.click();
            observer.observe(document.body, OBS_CONF_LIST);

            let prevTime = Date.now();
            while (popup == undefined) {
                if (Date.now() - prevTime > 4000) {
                    onTimeout("Поле \"Город\" не заполнено", observer);
                    break;
                }
                
                await sleep(100);
            }

            observer.disconnect();

            if (popup == undefined)
                return outDict;
            
            let closePopupEvent = new KeyboardEvent("keyup", { which: 27, bubbles: true });
            let regionListCont = popup.getElementsByClassName("region")[0]
                                 ?.getElementsByTagName("ul")[0];
            if (regionListCont == undefined)
                return outDict;
            
            let region = currentPresetData["region"].toLowerCase();
            let regionEntry = Array.from(regionListCont.children).map((e) => {
                return [ e.firstElementChild.innerText, e.firstElementChild ];
            }).find((entry) => {
                return entry[0]?.toLowerCase().includes(region);
            });
            if (regionEntry == undefined || regionEntry[1] == undefined) {
                alert("Поле \"Город\" не заполнено - указанного региона нет в списке сайта.");
                document.body.dispatchEvent(closePopupEvent);
                return outDict;
            }
            regionEntry[1].click();
    
            let cityListCont = popup.getElementsByClassName("city")[0]
                                    ?.getElementsByTagName("ul")[0];
            if (cityListCont == undefined)
                return outDict;
            
            let cityList = Array.from(cityListCont.querySelectorAll("span")).filter((s) => {
                return s.offsetParent != undefined;
            });
            if (cityList.length == 0)
                return outDict;
            
            let city = currentPresetData["city"];
            if (!clickItemByText(cityList, city)) {
                alert("Поле \"Город\" не заполнено - указанного города нет в списке сайта.");
                document.body.dispatchEvent(closePopupEvent);
                return outDict;
            }
            outDict["region"] = true;
            outDict["city"] = true;

            document.body.dispatchEvent(closePopupEvent);

            await sleep(150);
            
            return outDict;
        },
        
        // 19. class="data-line"
        async () => {
            let dict = {
                "email": "femail",
                "text": "new_content",
                "price": "new_price",
                "address": "new_places"
            };
            
            let outDict = getDictionary(dict, { "mode": "byID" });
            if (outDict == undefined)
                return;
            if (Object.keys(outDict).length != Object.keys(dict).length)
                return outDict;

            dict = {
                "fio": "fname",
                "phone": "fphone"
            };
            outDict = {...outDict, ...getDictionary(dict, { "mode": "byID" })};
            
            let regionInput = document.getElementsByName("new_region")[0];
            let regionList = regionInput?.parentElement?.nextElementSibling
                                        ?.querySelectorAll("a");
            if (regionList == undefined || regionList.length == 0)
                return outDict;

            let selectedRegion = regionInput.previousElementSibling.innerText;
            let region = currentPresetData["region"].toLowerCase();
            let regionElem = Array.from(regionList).find((e) => {
                return e.innerText.toLowerCase().includes(region);
            });
            if (regionElem == undefined) {
                alert("Поля \"Регион\" и \"Город\" не заполнены - указанного региона нет в списке сайта.");
                return outDict;
            }
            outDict["region"] = true;

            let cityListCont = document.getElementById("city_place");
            if (cityListCont == undefined)
                return outDict;
            
            if (!regionElem.innerText.toLowerCase().includes(selectedRegion.toLowerCase())) {
                let prevTime;
                let citiesLoaded = false;
                let observer = new MutationObserver((mutations, obs) => {
                    if (mutations[0].addedNodes[0]?.tagName.toLowerCase() == "ul")
                        citiesLoaded = true;
                });
                regionElem.click();
                
                observer.observe(cityListCont, OBS_CONF_LIST);
    
                prevTime = Date.now();
                while (!citiesLoaded) {
                    if (Date.now() - prevTime > 4000) {
                        onTimeout("Поля \"Регион\" и \"Город\" не заполнены", observer);
                        return outDict;
                    }
                    
                    await sleep(100);
                }
            }

            let cityList = cityListCont.getElementsByClassName("dropdown-menu")[0]?.querySelectorAll("a");
            if (cityList == undefined)
                return outDict;

            let city = currentPresetData["city"];
            if (!clickItemByText(cityList, city, "contains")) {
                alert("Поле \"Город\" не заполнено - указанного города нет в списке сайта.");
                return outDict;
            }
            outDict["city"] = true;
            
            return outDict;
        },
        
        // 20. class="fancy_select"
        async () => {
            let dict = {
                "header": "title",
                "text": "Item_Description",
                "price": "price"
            };
            
            let outDict = getDictionary(dict, { "mode": "byName" });
            if (outDict == undefined)
                return;
            
            dict = {
                "phone": "user_phone",
                "email": "email",
                "address": "address"
            };
            let outDict1 = getDictionary(dict, { "mode": "byID" });
            if (outDict1 == undefined)
                return;
            
            outDict = {...outDict, ...outDict1};
            
            if (Object.keys(outDict).length != 6)
                return outDict;
            
            let regionSelect = document.getElementById("region");
            let regionTrigger = regionSelect?.parentElement.getElementsByClassName("trigger")[0];
            if (regionSelect == undefined || regionTrigger == undefined)
                return outDict;
            
            let parentElem = regionSelect.parentElement?.parentElement;
            if (parentElem == undefined)
                return outDict;
            
            let citiesLoaded = false;
            let observer = new MutationObserver((mutations, obs) => {
                for (let mutation of mutations)
                    if (!citiesLoaded
                        && mutation.removedNodes[0]?.tagName.toLowerCase() == "select")
                        citiesLoaded = true;
            });
            
            observer.observe(parentElem, OBS_CONF_LIST);
            
            if (!selectOptionByText(regionSelect, currentPresetData["region"], "contains")) {
                alert("Поля \"Регион\" и \"Город\" не заполнены - указанного региона нет в списке сайта.");
                return outDict;
            }
            regionTrigger.click();
            regionTrigger.dispatchEvent(closeEv);
            outDict["region"] = true;
            
            let prevTime = Date.now();
            while (!citiesLoaded) {
                if (Date.now() - prevTime > 4000) {
                    alert("Поле \"Город\" не заполнено - список городов не открылся.");
                    break;
                }
                
                await sleep(100);
            }
            observer.disconnect();
            
            let citySelect = document.getElementById("cit");
            let cityTrigger = citySelect?.parentElement.getElementsByClassName("trigger")[0];
            if (citySelect == undefined || cityTrigger == undefined)
                return outDict;
            
            if (!selectOptionByText(citySelect, currentPresetData["city"])) {
                onTimeout("Поле \"Город\" не заполнено", observer);
                return outDict;
            }
            cityTrigger.click();
            cityTrigger.dispatchEvent(closeEv);
            outDict["city"] = true;
            
            return outDict;
        },
        
        // 21. class="field**"
        () => {
            let dict = {
                "phone": "pub_phone1",
                "email": "email",
                "website": "url",
                "header": "title",
                "text": "detail",
                "address": "google_map"
            };
            
            let outDict = getDictionary(dict, { "mode": "byName" });
            if (outDict == undefined)
                return;
            
            if (Object.keys(outDict).length != Object.keys(dict).length)
                return outDict;
            
            fillField(document.getElementById("email_confirm"), currentPresetData["email"], true);
            
            let countrySel = document.getElementById("a11");
            if (countrySel == undefined || !selectOptionByText(countrySel, "Россия"))
                return outDict;
            
            let regionSel = document.getElementById("a12");
            if (regionSel == undefined)
                return outDict;
            if (!selectOptionByText(regionSel, currentPresetData["region"], "contains")) {
                alert("Поля \"Регион\" и \"Город\" не заполнены - указанного региона нет в списке сайта.");
                return outDict;
            }
            outDict["region"] = true;
            
            let citySel = document.getElementById("a13");
            if (citySel == undefined)
                return outDict;
            if (!selectOptionByText(citySel, currentPresetData["city"])) {
                alert("Поле \"Город\" не заполнено - указанного города нет в списке сайта.");
                return outDict;
            }
            outDict["city"] = true;
            
            return outDict;
        },

        // 22. class="new_ad_frm_title" 
        () => {
            let dict = {
                "phone": "tel2",
                "email": "email",
                "website": "url",
                "text": "mtxt",
                "price": "opt[8]"
            };

            let outDict = getDictionary(dict, { "mode": "byName" });
            if (outDict == undefined)
                return;
            
            if (Object.keys(outDict).length != Object.keys(dict).length)
                return outDict;
            
            let regionSel = document.getElementsByName("region")[0];
            let citySel = document.getElementsByName("region_town")[0];
            if (regionSel == undefined || citySel == undefined)
                return outDict;
            
            if (!selectOptionByText(regionSel, currentPresetData["region"], "contains")) {
                alert("Поля \"Регион\" и \"Город\" не заполнены - указанного региона нет в списке сайта.");
                return outDict;
            }
            outDict["region"] = true;

            if (!selectOptionByText(citySel, currentPresetData["city"])) {
                alert("Поле \"Город\" не заполнено - указанного города нет в списке сайта.");
                return outDict;
            }
            outDict["city"] = true;
            
            return outDict;
        },
        
        // 23. form id="add_form"
        async () => {
            let dict = {
                "phone": "fbTel",
                "email": "comp_4",
                "website": "comp_5",
                "header": "name",
                "text": "adv_text",
                "address": "comp_2",
                "price": "coast"
            };
            
            let outDict = getDictionary(dict, { "mode": "byID" });
            if (outDict == undefined)
                return;
            if (Object.keys(outDict).length != Object.keys(dict).length)
                return outDict;
            
            dict = {};
        
            let typeRadios = document.getElementsByName("is_company_tmp");
            if (typeRadios.length == 2) {
                if (currentPresetData["type"] == "face") {
                    dict["fio"] = "comp_0";
                    typeRadios[0].click();
                }
                else {
                    dict["fio"] = "comp_1";
                    dict["org"] = "comp_0";
                    typeRadios[1].click();
                }
                
                outDict["type"] = true;
            }
            let outDict1 = getDictionary(dict, { "mode": "byID" });
            if (outDict1 == undefined)
                return;
            
            outDict = {...outDict, ...outDict1};
            
            
            let regionSel = document.getElementById("region_sel_1");
            let citySelCont = document.getElementById("new_reg_sel_2");
            if (regionSel == undefined || citySelCont == undefined)
                return outDict;
            
            let citiesLoaded = false;
            let observer = new MutationObserver((mutations, obs) => {
                if (mutations[0].removedNodes[0]?.tagName.toLowerCase() == "span")
                    citiesLoaded = true;
            });

            if (!selectOptionByText(regionSel, currentPresetData["region"], "contains")) {
                alert("Поля \"Регион\" и \"Город\" не заполнены - указанного региона нет в списке сайта.");
                return outDict;
            }
            outDict["region"] = true;

            // Если появился значок загрузки
            if (citySelCont.firstElementChild?.tagName.toLowerCase() == "span") {
                observer.observe(citySelCont, OBS_CONF_LIST);

                let prevTime = Date.now();
                while (!citiesLoaded) {
                    if (Date.now() - prevTime > 4000) {
                        onTimeout("Поле \"Город\" не заполнено", observer);
                        break;
                    }
                    
                    await sleep(100);
                }
                observer.disconnect();

                let citySel = document.getElementById("region_sel_last1");
                if (citySel == undefined)
                    return outDict;
                if (!selectOptionByText(citySel, currentPresetData["city"])) {
                    alert("Поле \"Город\" не заполнено - указанного города нет в списке сайта.");
                    return outDict;
                }
                outDict["city"] = true;
            }
            
            return outDict;
        },

        // 24. class="formLine"
        async () => {
            let dict = {
                "fio": "user_name",
                "phone": "user_phone",
                "email": "user_email",
                "text": "text",
                "price": "price"
            };

            let outDict = getDictionary(dict, { "mode": "byID" });
            if (outDict == undefined)
                return;
            
            if (Object.keys(outDict).length != Object.keys(dict).length)
                return outDict;
            
            let locationCont = document.getElementById("select-location-ajax");
            if (locationCont == undefined)
                return outDict;
            
            let locationSel = locationCont.getElementsByTagName("select")[0];
            if (locationSel == undefined)
                return outDict;
            
            let citiesLoaded = false;
            let observer = new MutationObserver((mutations, obs) => {
                for (let node of mutations[0].addedNodes) {
                    if (node.tagName?.toLowerCase() == "select") {
                        citiesLoaded = true;
                        break;
                    }
                }
            });

            if (!selectOptionByText(locationSel, currentPresetData["region"], "contains")) {
                alert("Поля \"Регион\" и \"Город\" не заполнены - указанного региона нет в списке сайта.")
                return outDict;
            }
            outDict["region"] = true;
            observer.observe(locationCont, OBS_CONF_LIST);

            let prevTime = Date.now();
            while (!citiesLoaded) {
                if (Date.now() - prevTime > 4000) {
                    onTimeout("Поле \"Город\" не заполнено", observer);
                    break;
                }
                
                await sleep(100);
            }
            observer.disconnect();

            if (!citiesLoaded)
                return outDict;

            locationSel = locationCont.getElementsByTagName("select")[0];
            if (locationSel == undefined)
                return outDict;
            
            if (!selectOptionByText(locationSel, currentPresetData["city"])) {
                alert("Поле \"Город\" не заполнено - указанного города нет в списке сайта.");
                return outDict;
            }
            outDict["city"] = true;
             
            return outDict;
        },

        // 25. class="col-12 col-lg-8"
        async () => {
            let dict = {
                "fio": "name",
                "email": "email",
                "website": "f_120",
                "header": "title",
                "address": "f_117",
                "price": "f_116"
            };

            let outDict = getDictionary(dict, { "mode": "byName" });
            if (outDict == undefined)
                return;
            
            let regionInp = document.getElementById("add_region");
            if (regionInp == undefined)
                return outDict;
            
            // Найти переменную - экземляр редактора текста для поля "Текст"
            for (let name of Object.getOwnPropertyNames(window)) {
                let obj = window[name];
                try {
                    if (obj.config?._config != undefined && obj["setData"] != undefined)
                    {
                        let textSpan = document.createElement("span");
                        textSpan.innerHTML = currentPresetData["text"];
                        obj.setData("");
                        obj.setData(textSpan.innerText);
                        outDict["text"] = true;
                        break;
                    }
                }
                catch {}
            }

            let regionSel = document.getElementById("alert_region_success")
                            ?.parentElement.getElementsByTagName("select")[0];
            if (regionSel == undefined)
                return outDict;
            
            let citiesLoaded = false;
            let observer = new MutationObserver((mutations, obs) => {
                if (mutations[0].attributeName == "value")
                    citiesLoaded = true;
            });

            if (!selectOptionByText(regionSel, currentPresetData["region"], "contains")) {
                alert("Поля \"Регион\" и \"Город\" не заполнены - указанного региона нет в списке сайта.")
                return outDict;
            }
            outDict["region"] = true;
            observer.observe(regionInp, OBS_CONF_ATTR);

            let prevTime = Date.now();
            while (!citiesLoaded) {
                if (Date.now() - prevTime > 4000) {
                    onTimeout("Поле \"Город\" не заполнено", observer);
                    break;
                }
                
                await sleep(100);
            }
            observer.disconnect();

            if (!citiesLoaded)
                return outDict;
            
            let citySel = regionSel.nextElementSibling?.getElementsByTagName("select")[0];
            if (citySel == undefined)
                return outDict;
            
            if (!selectOptionByText(citySel, currentPresetData["city"])) {
                alert("Поле \"Город\" не заполнено - указанного города нет в списке сайта.");
                return outDict;
            }
            outDict["city"] = true;
            
            return outDict;
        },

        // 26. class="input"
        async () => {
            let dict = {
                "fio": "titleuser",
                "phone": "teluser",
                "email": "emailuser",
                "header": "creatematnoregform-title",
                "text": "creatematnoregform-full_text",
                "price": "creatematnoregform-cena"
            };

            let outDict = getDictionary(dict, { "mode": "byID" });
            if (outDict == undefined)
                return;
            
            if (Object.keys(outDict).length != Object.keys(dict).length)
                return outDict;
            
            let listLoaded = false;
            let observer = new MutationObserver((mutations, obs) => {
                if (mutations.at(-1).addedNodes.length > 0)
                    listLoaded = true;
            });

            let countrySel = document.getElementById("countryid");
            let regionSel = document.getElementById("regionid");
            let citySel = document.getElementById("townid");
            if (countrySel == undefined || regionSel == undefined || citySel == undefined
                || !selectOptionByText(countrySel, "Россия"))
                return outDict;
            
            observer.observe(regionSel, OBS_CONF_LIST);

            let prevTime = Date.now();
            while (!listLoaded) {
                if (Date.now() - prevTime > 4000) {
                    onTimeout("Поля \"Регион\" и \"Город\" не заполнены", observer);
                    break;
                }
                
                await sleep(100);
            }
            observer.disconnect();

            if (!listLoaded)
                return outDict;
            
            listLoaded = false;

            if (!selectOptionByText(regionSel, currentPresetData["region"], "contains")) {
                alert("Поля \"Регион\" и \"Город\" не заполнены - указанного региона нет в списке сайта.")
                return outDict;
            }
            outDict["region"] = true;
            observer.observe(citySel, OBS_CONF_LIST);

            prevTime = Date.now();
            while (!listLoaded) {
                if (Date.now() - prevTime > 4000) {
                    onTimeout("Поле \"Город\" не заполнено", observer);
                    break;
                }
                
                await sleep(100);
            }
            observer.disconnect();

            if (!listLoaded)
                return outDict;
            
            if (!selectOptionByText(citySel, currentPresetData["city"])) {
                alert("Поле \"Город\" не заполнено - указанного города нет в списке сайта.");
                return outDict;
            }
            outDict["city"] = true;
            
            return outDict;
        },

        // 27. class="col-12 col-sm-9"
        async () => {
            let dict = {
                "phone": "rtcl-phone",
                "email": "rtcl-email",
                "header": "rtcl-title",
                "text": "description",
                "address": "rtcl-address",
                "price": "rtcl-price"
            };

            let outDict = getDictionary(dict, { "mode": "byID" });
            if (outDict == undefined)
                return;
            
            if (Object.keys(outDict).length != Object.keys(dict).length)
                return outDict;
            
            let regionSel = document.getElementById("rtcl-location");
            if (regionSel == undefined)
                return outDict;
            
            let citiesLoaded = false;
            let observer = new MutationObserver((mutations, obs) => {
                if (mutations[0].removedNodes.length == 1)
                    citiesLoaded = true;
            });

            if (!selectOptionByText(regionSel, currentPresetData["region"], "contains")) {
                alert("Поля \"Регион\" и \"Город\" не заполнены - указанного региона нет в списке сайта.")
                return outDict;
            }
            outDict["region"] = true;
            observer.observe(regionSel.parentElement, OBS_CONF_LIST);

            let prevTime = Date.now();
            while (!citiesLoaded) {
                if (Date.now() - prevTime > 4000) {
                    onTimeout("Поле \"Город\" не заполнено", observer);
                    break;
                }
                
                await sleep(100);
            }
            observer.disconnect();

            if (!citiesLoaded)
                return outDict;
            
            let citySel = document.getElementById("rtcl-sub-location");
            if (citySel == undefined)
                return outDict;
            
            if (!selectOptionByText(citySel, currentPresetData["city"])) {
                alert("Поле \"Город\" не заполнено - указанного города нет в списке сайта.");
                return outDict;
            }
            outDict["city"] = true;
            
            return outDict;
        },

        // 28. class="fieldContent"
        async () => {
            let dict = {
                "website": "ad_address",
                "header": "ad_title",
                "text": "ad_text",
                "address": "ad_address",
                "price": "ad_price"
            };
            
            let outDict = { ...getDictionary(dict, { "mode": "byName" }) };
            if (outDict == undefined)
                return;
            
            let emailInput = document.getElementsByClassName("info-email-email")[0];
            let emailEntry;
            if (emailInput != undefined)
                emailEntry = { "email": emailInput };
            
            outDict = {...outDict, ...emailEntry};
            
            if (Object.keys(outDict).length != 6)
                return outDict;
            
            let phoneCodeField = document.getElementsByClassName("info-phone-country")[0]
                                 .getElementsByTagName("input")[0];
            let phoneCityField = document.getElementsByClassName("info-phone-city")[0]
                                 .getElementsByTagName("input")[0];
            let phoneField = document.getElementsByClassName("info-phone-number")[0]
                             .getElementsByTagName("input")[0];
            if (phoneCodeField != undefined || phoneCityField != undefined || phoneField != undefined) {
                let phone = currentPresetData["phone"].match(/[0-9]/g);;
                fillField(phoneCodeField, phone.slice(0, 1).join(""), true);
                fillField(phoneCityField, phone.slice(1, 4).join(""), true);
                fillField(phoneField, phone.slice(4).join(""), true);
            }
            
            let regionSel = document.getElementById("ad_city_region");
            let citySel = document.getElementById("ad_city_city");
            if (regionSel == undefined || citySel == undefined)
                return outDict;

            let citiesLoaded = false;
            let observer = new MutationObserver((mutations, obs) => {
                let target = mutations[0].target;
                if (mutations[0].attributeName == "disabled" && !target.disabled)
                    citiesLoaded = true;
            });

            if (!selectOptionByText(regionSel, currentPresetData["region"], "contains")) {
                alert("Поля \"Регион\" и \"Город\" не заполнены - указанного региона нет в списке сайта.")
                return outDict;
            }
            outDict["region"] = true;
            observer.observe(citySel, OBS_CONF_ATTR);

            let prevTime = Date.now();
            while (!citiesLoaded) {
                if (Date.now() - prevTime > 4000) {
                    onTimeout("Поле \"Город\" не заполнено", observer);
                    break;
                }
                
                await sleep(100);
            }
            observer.disconnect();

            if (!citiesLoaded)
                return outDict;
            
            if (!selectOptionByText(citySel, currentPresetData["city"])) {
                alert("Поле \"Город\" не заполнено - указанного города нет в списке сайта.");
                return outDict;
            }
            outDict["city"] = true;
            
            return outDict;
        },

        // 29. class="inpTxt"
        async () => {
            let dict = {
                "phone": "phone",
                "header": "title",
                "text": "description",
                "price": "price"
            };
            
            let outDict = getDictionary(dict, { "mode": "byName" });
            if (outDict == undefined)
                return;
            
            let city = currentPresetData["city"].toLowerCase();
            let cityField = document.getElementsByName("city_name")[0];
            let cityListCont = cityField?.parentElement
                               ?.getElementsByClassName("results_container")[0];
            if (Object.keys(outDict).length != Object.keys(dict).length
                || cityField == undefined || cityListCont == undefined)
                return outDict;
            
            let citiesLoaded = false;
            let observer = new MutationObserver((mutations, obs) => {
                let style = mutations[0].target.style;
                if (mutations[0].attributeName == "style" && style.display != "none")
                    citiesLoaded = true;
            });

            cityField.value = city;
            cityField.click();
            
            observer.observe(cityListCont, OBS_CONF_ATTR);

            let prevTime = Date.now();
            while (!citiesLoaded) {
                if (Date.now() - prevTime > 4000) {
                    onTimeout("Поле \"Город\" не заполнено", observer);
                    break;
                }
                
                await sleep(100);
            }
            observer.disconnect();

            if (!citiesLoaded)
                return outDict;
            
            let cityList = cityListCont.querySelectorAll("li:not([class='note'])");
            if (cityList.length == 0)
                return outDict;
            
            let cityElem = Array.from(cityList)
                           .find(e => e.dataset["cityName"]?.toLowerCase() == city);
            if (cityElem == undefined) {
                alert("Поле \"Город\" не заполнено - указанного города нет в списке сайта.");
                return outDict;
            }
            cityElem.click();
            outDict["city"] = true;
            
            return outDict;
        },

        // 30. class="col-sm-6 padding-5 use_help"
        async () => {
            let dict = {
                "fio": "advs_username",
                "phone": "advs_phone",
                "website": "advs_site",
                "text": "advs_description",
                "price": "advs_price",

                "email": "advs_email"
            };
            
            let outDict = getDictionary(dict, { "mode": "byID" });
            if (outDict == undefined)
                return;
            
            let loadPopup = document.getElementById("page_loading");
            if (loadPopup == undefined)
                return outDict;
            
            let companyEntry;
        
            let loaded = false;
            let observer = new MutationObserver((mutations, obs) => {
                if (mutations[0].attributeName == "style" && loadPopup.style.display == "none")
                    loaded = true;
            });

            let typeChanged = false;
            let isCompany = false;
            let typeRadios = document.getElementsByName("advs[user_type]");
            if (typeRadios.length == 2) {
                if (currentPresetData["type"] == "face") {
                    if (!typeRadios[0].checked) {
                        typeChanged = true;
                        typeRadios[0].click();
                    }
                }
                else {
                    isCompany = true;
                    
                    if (!typeRadios[1].checked) {
                        typeChanged = true;
                        typeRadios[1].click();
                    }
                }
                
                if (typeChanged && isCompany) {
                    observer.observe(loadPopup, OBS_CONF_ATTR);

                    let prevTime = Date.now();
                    while (!loaded) {
                        if (Date.now() - prevTime > 4000 * 2)
                            break;
                        
                        await sleep(100);
                    }
                    loaded = false;
                    
                    observer.disconnect();

                    let companyField = document.getElementById("advs_company_name");
                    if (companyField != undefined)
                        companyEntry = { "org": companyField };
                }
                
                outDict["type"] = true;
            }
            
            outDict = {...outDict, ...companyEntry};

            let regionSel = document.getElementById("advs_area_id");
            if (regionSel == undefined)
                return outDict;
            
            if (!selectOptionByText(regionSel, currentPresetData["region"], "contains")) {
                alert("Поля \"Регион\" и \"Город\" не заполнены - указанного региона нет в списке сайта.")
                return outDict;
            }
            outDict["region"] = true;

            let prevTime = Date.now();

            observer.observe(loadPopup, OBS_CONF_ATTR);
            while (!loaded) {
                if (Date.now() - prevTime > 4000 * 2) {
                    onTimeout("Поля \"Регион\" и \"Город\" не заполнены", observer);
                    break;
                }
                
                await sleep(100);
            }
            observer.disconnect();

            if (!loaded)
                return outDict;
            loaded = false;
            
            let citySel = document.getElementById("advs_region_id");
            if (citySel == undefined)
                return outDict;
            
            if (!selectOptionByText(citySel, currentPresetData["city"])) {
                alert("Поле \"Город\" не заполнено - указанного города нет в списке сайта.");
                return outDict;
            }
            outDict["city"] = true;

            observer.observe(loadPopup, OBS_CONF_ATTR);
            prevTime = Date.now();
            while (!loaded) {
                if (Date.now() - prevTime > 4000 * 2) {
                    onTimeout("Поле \"Город\" не заполнено", observer);
                    break;
                }
                
                await sleep(100);
            }
            observer.disconnect();

            // Некоторые элементы "открепляются" от страницы к этому моменту,
            // поэтому нужно обновить словарь.
            return {...outDict, ...getDictionary(dict, { "mode": "byID" })};
        },

        // 31. table class="filled border w100"
        async () => {
            let dict = {
                "fio": "name",
                "phone": "phone",
                "email": "email",
                "header": "add_name",
                "text": "add_description",
                "price": "add_price"
            };
            
            let outDict = getDictionary(dict, { "mode": "byName" });
            if (outDict == undefined)
                return;
            
            if (Object.keys(outDict).length != Object.keys(dict).length)
                return outDict;
            
            let typeSel = document.getElementsByName("private")[0];
            if (typeSel != undefined) {
                let typeText = currentPresetData["type"] == "face"
                           ? "частное лицо" : "организация";
                if (selectOptionByText(typeSel, typeText))
                    outDict["type"] = true;
            }

            let regionField = document.getElementById("geoid_str");
            let citySelCont = document.getElementById("rn_place");
            let regionListCont = document.getElementById("geoid_props");
            if (regionField == undefined || citySelCont == undefined || regionListCont == undefined)
                return outDict;
            
            let regionsLoaded = false;
            let citiesLoaded = false;
            let observer = new MutationObserver((mutations, obs) => {
                let style = mutations[0].target.style;
                if (mutations[0].attributeName == "style" && style.visibility == "visible")
                    regionsLoaded = true;
            });
            let citiesObserver = new MutationObserver((mutations, obs) => {
                if (mutations.at(-1).addedNodes.length > 0)
                    citiesLoaded = true;
            });

            regionField.value = currentPresetData["region"].toLowerCase();
            regionField.dispatchEvent(focusEv);
            regionField.dispatchEvent(keyUpEv);

            observer.observe(regionListCont, OBS_CONF_ATTR);

            let prevTime = Date.now();
            while (!regionsLoaded) {
                if (Date.now() - prevTime > 4000) {
                    onTimeout("Поля \"Регион\" и \"Город\" не заполнены", observer);
                    break;
                }
                
                await sleep(100);
            }
            observer.disconnect();

            if (!regionsLoaded)
                return outDict;
            
            let region = currentPresetData["region"].toLowerCase();
            let regionElem = Array.from(regionListCont.getElementsByTagName("td"))
                                  .find(td => td.innerText.toLowerCase().includes(region));
            if (regionElem == undefined) {
                alert("Поля \"Регион\" и \"Город\" не заполнены - указанного региона нет в списке сайта.");
                return outDict;
            }
            regionElem.dispatchEvent(mouseDownEv);
            outDict["region"] = true;

            citiesObserver.observe(citySelCont, OBS_CONF_LIST);

            prevTime = Date.now();
            while (!citiesLoaded) {
                if (Date.now() - prevTime > 4000) {
                    onTimeout("Поле \"Город\" не заполнено", observer);
                    break;
                }
                
                await sleep(100);
            }
            citiesObserver.disconnect();

            if (!citiesLoaded)
                return outDict;
            
            let citySel = citySelCont.getElementsByTagName("select")[0];
            if (citySel == undefined)
                return outDict;
            
            if (!selectOptionByText(citySel, currentPresetData["city"])) {
                alert("Поле \"Город\" не заполнено - указанного города нет в списке сайта.");
                return outDict;
            }
            outDict["city"] = true;
            
            return outDict;
        },

        // 32. class="cli"; div id="true_email"
        async () => {
            let dict = {
                "fio": "contact_name",
                "phone": "contact_phone",
                "email": "user_email",
                "header": "title",
                "text": "info",
                "price": "price"
            };
            
            let outDict = getDictionary(dict, { "mode": "byName" });
            if (outDict == undefined)
                return;
            
            if (Object.keys(outDict).length != Object.keys(dict).length)
                return outDict;
            
            let cityButton = document.getElementById("select_town");
            if (cityButton == undefined)
                return outDict;
            
            let locationPopup = document.getElementById("select-location");
            if (locationPopup == undefined)
                return outDict;

            let popupSaveButton = locationPopup.getElementsByClassName("select-modal")[0];
            if (popupSaveButton == undefined)
                return outDict;
            let locationIndicator = locationPopup.getElementsByClassName("select-history")[0];
            if (locationIndicator == undefined)
                return outDict;
            let locationListCont = locationIndicator.parentElement.getElementsByTagName("ul")[0];
            if (locationListCont == undefined)
                return outDict;
            
            if (locationListCont.childElementCount == 0)
                return outDict;
            
            let loaded = false;
            let observer = new MutationObserver((mutations, obs) => {
                if (mutations.at(-1).addedNodes[0] instanceof Text)
                    loaded = true;
            });

            cityButton.click();
            observer.observe(locationIndicator, OBS_CONF_LIST);

            let prevTime = Date.now();
            while (!loaded) {
                if (Date.now() - prevTime > 4000) {
                    onTimeout("Поле \"Город\" не заполнено", observer);
                    break;
                }
                
                await sleep(100);
            }
            observer.disconnect();

            if (!loaded)
                return outDict;

            if (!clickItemByText(locationListCont.getElementsByTagName("li"), currentPresetData["region"], "contains")) {
                alert("Поле \"Город\" не заполнено - указанного региона нет в списке сайта.");
                popupSaveButton.click();
                return outDict;
            }
            outDict["region"] = true;

            loaded = false;
            prevTime = Date.now();
            observer.observe(locationIndicator, OBS_CONF_LIST);
            while (!loaded) {
                if (Date.now() - prevTime > 4000) {
                    onTimeout("Поле \"Город\" не заполнено", observer);
                    break;
                }
                
                await sleep(100);
            }
            observer.disconnect();

            if (!loaded) {
                popupSaveButton.click();
                return outDict;
            }
            
            if (locationListCont.childElementCount == 0) {
                popupSaveButton.click();
                return outDict;
            }

            if (!clickItemByText(locationListCont.getElementsByTagName("li"), currentPresetData["city"])) {
                alert("Поле \"Город\" не заполнено - указанного региона нет в списке сайта.");
                popupSaveButton.click();
                return outDict;
            }
            outDict["city"] = true;
        
            popupSaveButton.click();

            return outDict;
        },

        // 33. class="dataStep*"
        async () => {
            let dict = {
                "fio": "name",
                "phone": "phone[0]",
                "email": "email",
                "website": "website",
                "header": "title",
                "text": "desc",
                "address": "address",
                "price": "price"
            };
            
            let outDict = getDictionary(dict, { "mode": "byName" });
            if (outDict == undefined)
                return;
            
            if (Object.keys(outDict).length != Object.keys(dict).length)
                return outDict;
            
            let typeButton = document.getElementById("personaTypeSelect-button");
            if (typeButton != undefined) {
                typeButton.click();

                let typeList = document.getElementById("personaTypeSelect-menu");
                if (typeList != undefined) {
                    let typeName = "частное лицо";
                    if (currentPresetData["type"] == "org") {
                        typeName = "организация";
                        outDict["org"] = document.getElementsByName("orgname")[0];
                    }
                    if (clickItemByText(typeList, typeName, "hover"))
                        outDict["type"] = true;
                }
            }
            
            let regionButton = document.getElementById("createRegionBtn");
            if (regionButton == undefined)
                return outDict;
            
            let loaded = false;
            let observer = new MutationObserver((mutations, obs) => {
                if (mutations[0].removedNodes.length > 0)
                    loaded = true;
            });

            regionButton.click();
            let regionListCont = document.getElementsByClassName("boxSelectRegion contentWait")[0];
            if (regionListCont == undefined)
                return outDict;
            
            observer.observe(regionListCont, OBS_CONF_LIST);

            let prevTime = Date.now();
            while (!loaded) {
                if (Date.now() - prevTime > 4000) {
                    onTimeout("Поля \"Регион\" и \"Город\" не заполнены", observer);
                    break;
                }
                
                await sleep(100);
            }
            observer.disconnect();

            if (!loaded)
                return outDict;
            
            let regionList = regionListCont.getElementsByClassName("jspContainer")[0]
                                           ?.getElementsByTagName("a");
            if (regionList.length == 0)
                return outDict;
            
            if (!clickItemByText(regionList, currentPresetData["region"], "contains")) {
                alert("Поле \"Регион\" не заполнено - указанного региона нет в списке сайта.");
                return outDict;
            }
            outDict["region"] = true;

            observer.observe(regionListCont, OBS_CONF_LIST);

            loaded = false;
            prevTime = Date.now();
            while (!loaded) {
                if (Date.now() - prevTime > 4000) {
                    onTimeout("Поле \"Регион\" не заполнено", observer);
                    break;
                }
                
                await sleep(100);
            }
            observer.disconnect();

            if (!loaded)
                return outDict;
            
            regionList = regionListCont.getElementsByClassName("jspContainer")[0]
                                        ?.getElementsByTagName("a");
            if (regionList.length == 0)
                return outDict;
            
            if (!clickItemByText(regionList, currentPresetData["city"])) {
                alert("Поле \"Регион\" не заполнено - указанного города нет в списке сайта.");
                return outDict;
            }
            outDict["city"] = true;
            
            return outDict;
        },

        // 34. class="gui_form"
        () => {
            let dict = {
                "fio": "UserName",
                "phone": "UserPhone",
                "email": "UserEmail",
                "website": "Url",
                "header": "Header",
                "text": "Comment",
                "price": "Price"
            };
            
            let outDict = getDictionary(dict, { "mode": "byName" });
            if (outDict == undefined)
                return;
            
            if (Object.keys(outDict).length != Object.keys(dict).length)
                return outDict;
            
            let citySel = document.getElementsByName("City")[0];
            if (citySel == undefined)
                return outDict;
            
            if (!selectOptionByText(citySel, currentPresetData["city"])) {
                alert("Поле \"Город\" не заполнено - указанного города нет в списке сайта.");
                return outDict;
            }
            outDict["city"] = true;
            
            return outDict;
        },

        // 35. class="nss-line-b"
        async () => {
            let dict = {
                "phone": "contact_phone",
                "email": "contact_email",
                "text": "info",
                "price": "price"
            };
            
            let outDict = getDictionary(dict, { "mode": "byName" });
            if (outDict == undefined)
                return;
            
            if (Object.keys(outDict).length != Object.keys(dict).length)
                return outDict;
            
            let titleLabel = document.getElementById("add-bl-title");
            if (titleLabel?.innerText.includes("Заголовок"))
                outDict["header"] = titleLabel.parentElement.getElementsByTagName("input")[0];
            else
                outDict["header"] = false;
            
            let cityButton = document.getElementById("select-location");
            if (cityButton == undefined || cityButton.style.display == "none")
                return outDict;
            
            let locationCont = cityButton.parentElement.getElementsByClassName("slclocation")[0];
            if (locationCont == undefined)
                return outDict;

            let locationIndicator = locationCont.getElementsByClassName("location_history")[0];
            if (locationIndicator == undefined)
                return outDict;
            let locationListCont = locationCont.getElementsByClassName("location_select")[0];
            if (locationListCont == undefined)
                return outDict;
            
            if (locationListCont.offsetParent != undefined
                && locationListCont.childElementCount == 0)
                return outDict;
            
            let loaded = false;
            let observer = new MutationObserver((mutations, obs) => {
                if (mutations.at(-1).addedNodes[0] instanceof HTMLLIElement)
                    loaded = true;
            });

            cityButton.click();
            observer.observe(locationIndicator, OBS_CONF_LIST);

            let prevTime = Date.now();
            while (!loaded) {
                if (Date.now() - prevTime > 4000) {
                    onTimeout("Поле \"Город\" не заполнено", observer);
                    break;
                }
                
                await sleep(100);
            }
            observer.disconnect();

            if (!loaded)
                return outDict;

            if (!clickItemByText(locationListCont.getElementsByTagName("a"), currentPresetData["region"], "contains")) {
                alert("Поле \"Город\" не заполнено - указанного региона нет в списке сайта.");
                return outDict;
            }
            outDict["region"] = true;

            loaded = false;
            prevTime = Date.now();
            observer.observe(locationIndicator, OBS_CONF_LIST);
            while (!loaded) {
                if (Date.now() - prevTime > 4000) {
                    onTimeout("Поле \"Город\" не заполнено", observer);
                    break;
                }
                
                await sleep(100);
            }
            observer.disconnect();

            if (!loaded)
                return outDict;
            
            if (locationListCont.childElementCount == 0)
                return outDict;

            if (!clickItemByText(locationListCont.getElementsByTagName("a"), currentPresetData["city"])) {
                alert("Поле \"Город\" не заполнено - указанного региона нет в списке сайта.");
                return outDict;
            }
            outDict["city"] = true;

            return outDict;
        },

        // 36. class="td2-add"
        async () => {
            let dict = {
                "fio": "name",
                "phone": "phone",
                "email": "email",
                "website": "site",
                "header": "title",
                "text": "message_add",
                "price": "price"
            };
            
            let outDict = getDictionary(dict, { "mode": "byID" });
            if (outDict == undefined)
                return;
            
            if (Object.keys(outDict).length != Object.keys(dict).length)
                return outDict;
            
            let cityButton = document.getElementById("cityLink");
            if (cityButton == undefined)
                return outDict;

            let popup = document.getElementById("popup");
            if (popup == undefined)
                return outDict;
            
            let loaded = false;
            let observer = new MutationObserver((mutations, obs) => {
                if (mutations.at(-1).addedNodes.length > 0)
                    loaded = true;
            });
            
            observer.observe(popup, OBS_CONF_LIST);
            cityButton.click();

            let prevTime = Date.now();
            while (!loaded) {
                if (Date.now() - prevTime > 4000) {
                    onTimeout("Поле \"Город\" не заполнено", observer);
                    break;
                }
                
                await sleep(100);
            }
            observer.disconnect();

            if (!loaded)
                return outDict;
            
            let popupDoc = popup.getElementsByTagName("iframe")[0]?.contentDocument;
            if (popupDoc == undefined)
                return outDict;
            
            let cityField = popupDoc.getElementById("ccity");
            let cityListCont = popupDoc.getElementById("clist");
            if (cityField == undefined || cityListCont == undefined)
                return outDict;
            
            let popupCloseButton;
            for (let a of popupDoc.getElementsByTagName("a")) {
                if (a.innerText.toLowerCase().includes("закрыть"))
                    popupCloseButton = a;
            }
            if (popupCloseButton == undefined)
                return outDict;
            
            if (!fillField(cityField, currentPresetData["city"])) {
                popupCloseButton.click();
                return outDict;
            }
            
            observer.observe(cityListCont, OBS_CONF_LIST);
            
            loaded = false;
            prevTime = Date.now();
            while (!loaded) {
                if (Date.now() - prevTime > 4000) {
                    onTimeout("Поле \"Город\" не заполнено", observer);
                    break;
                }
                
                await sleep(100);
            }
            observer.disconnect();

            if (!loaded) {
                popupCloseButton.click();
                return outDict;
            }
            
            if (cityListCont.childElementCount == 0) {
                alert("Поле \"Город\" не заполнено - указанного города нет в списке сайта.");
                popupCloseButton.click();
                return outDict;
            }
            if (!clickItemByText(cityListCont, currentPresetData["city"])) {
                alert("Поле \"Город\" не заполнено - указанного города нет в списке сайта.");
                popupCloseButton.click();
                return outDict;
            }
            outDict["city"] = true;

            popupCloseButton.click();
            
            return outDict;
        }
    ];
}