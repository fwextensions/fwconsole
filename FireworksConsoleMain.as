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


// ===========================================================================
private var prefs:SharedObject = SharedObject.getLocal("FWConsolePrefs");
private var consoleLC:LocalConnection = new LocalConnection();
private var currentCodeEntry:int = 0;
private var lastLogEntryTime:Number = 0;
private var isShiftDown:Boolean = false;
private var consolePollTimer:Timer = new Timer(ConsolePollInterval);

  
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
	var entriesJSON = MMExecute("console._logEntriesJSON");
//log("JSON", entriesJSON);

		// the JSON is a series of stringified objects, separated by commas,
		// not a proper array 
	var entries = JSON.decode("[" + entriesJSON + "]");

//	var entries = JSON.decode(MMExecute("console._logEntriesJSON"));

// this causes the processing dialog hang
//	callMethod("console._getEntriesSince", lastLogEntryTime);
//	var entriesJSON = MMExecute("console._logEntriesJSON");
//	var entries = JSON.decode(entriesJSON);

	if (entries is Array && entries.length > 0) {
		for (var i:uint = 0; i < entries.length; i++) {
			var entry:Object = entries[i];

				// add a : only if we've got the caller's name
			print(LogEntryPrefix + (entry.caller != "" ? (" " + entry.caller + ": ") : ""),
				entry.text + "\n");

				// keep track of the most recent entry we've printed, adding 1
				// so we don't pick up the last entry again
//			lastLogEntryTime = entry.time + 1;
		}

		MMExecute("console._logEntriesJSON = '';")
	} else {
//		print("", "*** No new console entries ***\n");
	}
} catch (e:*) {
log("printLog error");
log(e.message);
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
	printLog();
//	var entries = callMethod("console._getEntriesSince", (new Date()).getTime());
//
//	if (entries) {
//		entries = JSON.decode(entries);
//
//		if (entries is Array) {
//			for (var i:uint = 0; i < entries.length; i++) {
//				print(entries.caller, entries.text);
//			}
//		}
//	}
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
