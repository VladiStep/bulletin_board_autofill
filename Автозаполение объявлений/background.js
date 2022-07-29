async function getCurrentPreset() {
    let presets = (await chrome.storage.local.get("presets"))["presets"];
    let selIndex = (await chrome.storage.local.get("selectedPresetID"))["selectedPresetID"];
    
    return presets[selIndex];
}

var isRunning = false;
async function onEnterButtonClick() {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab.url.startsWith("chrome://"))
        return;
    
    if (isRunning) {
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => { alert("Скрипт ещё выполняется, пожалуйста подождите."); }
        });
        return;
    }

    isRunning = true;
    
    await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (data) => { window.currentPresetData = data; },
        args: [(await getCurrentPreset())[1]],
        world: chrome.scripting.ExecutionWorld.MAIN
    });
    let results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["fieldRoutines.js", "coreScript.js"],
        world: chrome.scripting.ExecutionWorld.MAIN
    });
    let result = results[0]["result"];
    if (typeof result == "string") {
        let errMsg = "Произошла ошибка.\n" +
                     "Подробности смотрите в консоли или в \"Управлении расширениями\".";
        await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: (errMsg) => { alert(errMsg); },
            args: [errMsg]
        });
        
        isRunning = false;

        throw new Error(result.slice(result.indexOf("Error: ") + 7));
    }

    isRunning = false;
}

chrome.commands.onCommand.addListener((command) => {
    if (command == "fillAll") {
        onEnterButtonClick();
    }
});