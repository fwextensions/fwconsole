/* ===========================================================================
	
	File: FireworksConsoleMain.as

	Author - John Dunning
	Copyright - 2007 John Dunning.  All rights reserved.
	Email - fw@johndunning.com
	Website - http://johndunning.com/fireworks

	Release - 0.2.0 ($Revision$)
	Last update - $Date$

   ======================================================================== */

/*

	To do:
		- convert AS objects to JSON and send string to console

		- provide option to poll or not

		- don't poll if text tool is active?

		- don't poll while FW is in background

		- track poll setting across sessions

		- provide console.log() for JS
			stores each log entry in an array
			track time of last log entry
			panel can poll the log every few seconds and dump out anything new
			need option to turn off polling
			unfortunately, we can't poll, because if the panel makes a JS call
				while another command is running, it will trigger the modal
				processing dialog, which blocks the UI
				we'll have to add a button to dump the log on demand

		- support multiple log types
			"assert", "count", "debug", "dir", "dirxml", "error", "group",
			"groupEnd", "info", "log", "profile", "profileEnd", "time",
			"timeEnd", "trace", "warn"

		- remember the divider size as a percentage, and restore based on the
			current height of the 

		- remember max number of code entries? 
		
		- support ctrl-backspace to delete by word, and ctrl-arrow for move by word

	Done:
		- remember and restore state of divider
*/

import flash.events.*;
import flash.net.LocalConnection;
import flash.net.SharedObject;
import flash.ui.Keyboard;
import mx.controls.TextArea;
import mx.controls.Alert;
import mx.events.*;
import adobe.utils.*;
import com.adobe.serialization.json.*;


//include "assets/fwlog.as";


// ===========================================================================
private const ConsolePollInterval:uint = 3000;
private const LogEntryPrefix:String = ">>>";

private const SupportedFWEvents:Object = {
	onFwApplicationActivate: 1,
	onFwApplicationDeactivate: 1,

		// this undocumented event is crucial for getting the current tool name
		// without calling fw.activeTool.  the tool name is the first parameter
		// to the handler.
	setfwActiveToolForSWFs: 1
};


// ===========================================================================
private var prefs:SharedObject = SharedObject.getLocal("FWConsolePrefs");
private var consoleLC:LocalConnection = new LocalConnection();
private var currentCodeEntry:int = 0;
private var lastLogEntryTime:Number = 0;
private var isShiftDown:Boolean = false;
private var consolePollTimer:Timer = new Timer(ConsolePollInterval);
private var currentTool:String = "";
private var preinitialized:Boolean = false;
private var logs:Array = [];

  
// ===========================================================================
private function onPreinitialize() : void
{
try {
		// we need to register these callbacks early in the startup process.
		// registering them from applicationComplete is too late.
//	if (ExternalInterface.available) {
//preinitialized = true;
//		ExternalInterface.addCallback("IsFwCallbackInstalled",
//			onIsFwCallbackInstalled);
//
//			// create a handler for all the supported events
//		for (var eventName in SupportedFWEvents) {
//logs.push(eventName);
//			ExternalInterface.addCallback(eventName,
//				createFWEventHandler(eventName));
//		}
//	}

		// we need to register these callbacks early in the startup process.
		// registering them from applicationComplete is too late.
	if (ExternalInterface.available) {
		ExternalInterface.addCallback("IsFwCallbackInstalled",
			function(inFunctionName:String) : Boolean
			{
logs.push(inFunctionName);
//				return true;
				return (inFunctionName == "setfwActiveToolForSWFs");
			}
		);

			// create a handler for getting the active tool when it changes
		ExternalInterface.addCallback("setfwActiveToolForSWFs",
			function(inToolName:String)
			{
log("setfwActiveToolForSWFs", inToolName);
				currentTool = inToolName;
			}
		);
	}
} catch (e:*) {
//fwlog(e.message);
logs.push("ERROR");
logs.push(e.message);
}
}


// ===========================================================================
private function main() : void 
{
	IOContainer.addEventListener(DividerEvent.DIVIDER_RELEASE, onDividerRelease, false, 0, true);
	
	Input = Input;
	Output = Output;
	
	Input.addEventListener(KeyboardEvent.KEY_DOWN, onInputKeyDown, true, 0, true);
	Input.addEventListener(KeyboardEvent.KEY_UP, onInputKeyUp, true, 0, true);
	Input.addEventListener(TextEvent.TEXT_INPUT, onTextInput, false, 0, true);
	Input.setFocus();

	Output.htmlText = prefs.data.savedOutput || "";
	Output.validateNow();
	Output.verticalScrollPosition = Output.maxVerticalScrollPosition;

	consolePollTimer.addEventListener(TimerEvent.TIMER, onConsolePoll, false, 0, true);
	consolePollTimer.start();
	
	prefs.data.codeEntries = prefs.data.codeEntries || [];
	currentCodeEntry = prefs.data.codeEntries.length;
	
	stage.addEventListener(ErrorEvent.ERROR, onError, false, 0, true);
	stage.addEventListener(FlexEvent.EXIT_STATE, onExit, false, 0, true);

		// default to a height of 50 for the 
	prefs.data.dividerY = prefs.data.dividerY || 50;
	IOContainer.getDividerAt(0).y = prefs.data.dividerY;

		// make console.log() available to other panels
	initLocalConnection();
	
	loadFCJS();

print("", logs.join("\n"));
//	MMExecute('fw.runScript("file:///C|/Projects/Fireworks/Commands/Dev/FireworksConsole/FireworksConsole.js")');
}


// ===========================================================================
private function evaluateCode() : void
{
try {
	var code:String = Input.text;
	
	if (code.length == 0) {
		return;
	}
	
	addCodeEntry(code);
	Input.text = "";
	
		// serialize the code string to handle quotations, newlines, etc.
	var result:String = callMethod('jdlib.FireworksConsole.evaluateCode', code);
	
	print(LogEntryPrefix + " " + code + ":", result + "\n");
} catch (e:*) {
//fwlog(e.message);
}
}


// ===========================================================================
private function print(
	inPrefix:String,
	inText:String) : void
{
	if (inPrefix) {
			// we want the prefix to be a different color, so we'll use htmlText,
			// which means all the <>& characters need to be replaced with entities
		inPrefix = inPrefix.replace(/&/g, "&amp;");
		inPrefix = inPrefix.replace(/</g, "&lt;");
		inPrefix = inPrefix.replace(/>/g, "&gt;");
		inText = inText.replace(/&/g, "&amp;");
		inText = inText.replace(/</g, "&lt;");
		inText = inText.replace(/>/g, "&gt;");
		
		Output.htmlText += '<font color="#585880">' + inPrefix + "</font> " + inText;
	} else {
			// there's no prefix, so we don't need to deal with html-formatted text
		Output.text += inText;
	}
	 
	prefs.data.savedOutput = Output.htmlText;
	prefs.flush(90);
	
		// force the text area to validate so we get the correct max scroll
		// height after adding the text
	Output.validateNow();
	Output.verticalScrollPosition = Output.maxVerticalScrollPosition;
}


// ===========================================================================
private function setInputText(
	inText:String) : void
{
	Input.text = inText;
	var len:int = Input.text.length;
	Input.setSelection(len, len);
}


// ===========================================================================
private function addCodeEntry(
	inCode:String) : void
{
	if (inCode != prefs.data.codeEntries[prefs.data.codeEntries.length - 1]) {
			// only add the code if it's not a repeat
		prefs.data.codeEntries.push(inCode);
		prefs.flush(90);
	}
	
	currentCodeEntry = prefs.data.codeEntries.length;
}


// ===========================================================================
private function showPreviousCodeEntry() : void
{
	if (currentCodeEntry - 1 >= 0) {
		currentCodeEntry--;
		setInputText(prefs.data.codeEntries[currentCodeEntry]);
	}
}


// ===========================================================================
private function showNextCodeEntry() : void
{
	var codeEntries:Array = prefs.data.codeEntries;
	
	if (currentCodeEntry + 1 <= codeEntries.length - 1) {
		currentCodeEntry++;
		setInputText(codeEntries[currentCodeEntry]);
	} else {
		currentCodeEntry = codeEntries.length;
		setInputText("");
	}
}


// ===========================================================================
private function togglePolling() : void
{
	if (PollConsole.selected) {
		consolePollTimer.start();
	} else {
		consolePollTimer.stop();
	}
}


// ===========================================================================
private function clearOutput() : void
{
	Output.text = "";
	prefs.data.savedOutput = "";
}


// ===========================================================================
private function initLocalConnection() : void
{
		// the main app object implements the functions that can be called by
		// the LocalConnection (log)
	consoleLC.client = this;
	consoleLC.connect("FireworksConsole");
}


// ===========================================================================
public function log(
	...inArgs) : void
{
	print("", inArgs.join(", ") + "\n");
}


// ===========================================================================
private function printLog() : void
{
	try {
			// we can't call a method and have it stringify the log entries at
			// that time, so the console JS code has to build up the JSON string
			// as it goes.  so just access it as an attribute, not a method call.
		var entriesJSON = MMExecute("console._logEntriesJSON");

			// the JSON is a series of stringified objects, separated by commas,
			// not a proper JSON array, so add the brackets before decoding
		var entries = JSON.decode("[" + entriesJSON + "]");

		if (entries is Array && entries.length > 0) {
			for (var i:uint = 0; i < entries.length; i++) {
				var entry:Object = entries[i];

					// add a : only if we've got the caller's name
				print(LogEntryPrefix + (entry.caller != "" ? (" " + entry.caller + "():") : ""),
					entry.text + "\n");
			}

				// clear the entries, now that we've displayed them
			MMExecute("console._logEntriesJSON = '';")
		} else {
	//		print("", "*** No new console entries ***\n");
		}
	} catch (e:*) {
		log("printLog error", e.message);
	}
}


// ===========================================================================
private function loadFCJS() : void
{
		// load the embedded JS into FW, since it hasn't been during this session
	MMExecute((new FireworksConsoleJS()).toString());
}


// ===========================================================================
private function callMethod(
	inMethodName:String,
	...inArgs) : String
{
		// strip the [ ] from the JSON version of the inArgs array, since we'll
		// be using it as method parameters
	var argString:String = JSON.encode(inArgs).slice(1, -1);

		// include a semi-colon at the end so that the command history steps have them
	var js:String = inMethodName + "(" + argString + ");";

	return MMExecute(js);
}


// ===========================================================================
private function createFWEventHandler(
	inEventName:String) : Function
{
	if (inEventName == "setfwActiveToolForSWFs") {
			// create a special handler for this event that stores the current
			// tool name, so we can check it in onAppJSEvent and ignore events
			// during text editing.  we have to use a special handler because
			// this is the only FW event that gets called with a parameter.  we
			// don't need to call onAppJSEvent from here because the JS side
			// shouldn't need to listen to this event.  it can just listen for
			// onFwActiveToolChange and then check fw.activeTool.
		return function(
				inToolName)
			{
				currentTool = inToolName;
log("method", inEventName, inToolName);
			};
	} else {
		return function()
			{
log("method", inEventName);

//					// only pass the event to the panel if it's actually listening
//					// for it, to avoid the overhead of passing data to the JS side.
//					// switching documents triggers 4 events, so they can add up.
//				if (inEventName in registeredFWEvents) {
//					onAppJSEvent({ type: inEventName });
//				}
			};
	}
}


// ===========================================================================
private function onTextInput(
	inEvent:TextEvent) : void
{
	var ascii:int = inEvent.text.charCodeAt(0);
	
		// don't allow newlines or returns, unless shift is down
	if (!isShiftDown && (ascii == 13 || ascii == 10)) {
			// stop the event propagation so that he newline doesn't get
			// added to the text
		inEvent.preventDefault();
		inEvent.stopPropagation();
		evaluateCode();
	}
}


// ===========================================================================
private function onInputKeyDown(
	inEvent:KeyboardEvent) : void
{
	switch (inEvent.keyCode) {
		case Keyboard.UP:
			if (inEvent.ctrlKey) {
				showPreviousCodeEntry();
			}
			break;
			
		case Keyboard.DOWN:
			if (inEvent.ctrlKey) {
				showNextCodeEntry();
			}
			break;
	}

		// track whether the shift key is down so we can check its state in
		// onTextInput
	isShiftDown = inEvent.shiftKey;
}


// ===========================================================================
private function onInputKeyUp(
	inEvent:KeyboardEvent) : void
{
		// track whether the shift key is up so we can check its state in
		// onTextInput
	isShiftDown = inEvent.shiftKey;
}


// ===========================================================================
private function onDividerRelease(
	inEvent:DividerEvent) : void
{
		// store the current divider location so we can restore when next loaded
	prefs.data.dividerY = IOContainer.getDividerAt(0).y;
	prefs.flush(90);
}


// ===========================================================================
private function onConsolePoll(
	inEvent:TimerEvent) : void
{
	if (currentTool != "Text") {
		printLog();
	} else {
log(preinitialized, "currentTool", currentTool);
	}
}


// ===========================================================================
private function onIsFwCallbackInstalled(
	inFunctionName:String) : Boolean
{
	return (inFunctionName in SupportedFWEvents);
}


// ===========================================================================
private function onError(
	inEvent:ErrorEvent) : void
{
//fwlog("Error", inEvent.text);
}


// ===========================================================================
private function onExit(
	inEvent:FlexEvent) : void
{
//fwlog("exit");
	prefs.data.savedOutput = Output.text;
	prefs.data.dividerY = IOContainer.getDividerAt(0).y;
	prefs.flush(90);
}
