/* ===========================================================================
	
	File: FireworksConsoleMain.as

	Author - John Dunning
	Copyright - 2007 John Dunning.  All rights reserved.
	Email - fw@johndunning.com
	Website - http://johndunning.com/fireworks

	Release - 0.2.0 ($Revision$)
	Last update - $Date$

   ======================================================================== */


import flash.events.*;
import flash.net.LocalConnection;
import flash.net.SharedObject;
import flash.ui.Keyboard;
import mx.controls.TextArea;
import mx.events.FlexEvent;
import adobe.utils.*;
import com.serialization.json.*;
import bigroom.input.KeyPoll;
//import FireworksConsoleApp;


include "assets/fwlog.as";


private var prefs:SharedObject = SharedObject.getLocal("FWConsolePrefs");
private var inputArea:TextArea;
private var outputArea:TextArea;
private var currentCodeEntry:int = 0;
private var key:KeyPoll = null;

  
// ===========================================================================
private function main() : void 
{
	inputArea = Input;
	outputArea = Output;
	
	inputArea.addEventListener(KeyboardEvent.KEY_DOWN, onInputKeyDown, true, 0, true);
	inputArea.addEventListener(TextEvent.TEXT_INPUT, onTextInput, false, 0, true);
	inputArea.setFocus();
	
	outputArea.htmlText = prefs.data.savedOutput || "";
	outputArea.validateNow();
	outputArea.verticalScrollPosition = outputArea.maxVerticalScrollPosition;
	
	prefs.data.codeEntries = prefs.data.codeEntries || [];
	currentCodeEntry = prefs.data.codeEntries.length;
	
		// create a KeyPoll so we can tell whether the ctrl key is down when enter
		// is pressed
	key = new KeyPoll(stage);
	
	addEventListener(ErrorEvent.ERROR, onError, false, 0, true);
	addEventListener(FlexEvent.EXIT_STATE, onExit, false, 0, true);
	
	MMExecute('fw.runScript("file:///C|/Projects/Fireworks/Commands/Dev/FireworksConsole/FireworksConsole.js")');
}


// ===========================================================================
private function evaluateCode() : void
{
try {
//	var code:String = inputArea.text.slice(0, -1);
	var code:String = inputArea.text;
	
	if (code.length == 0) {
		return;
	}
	
	addCodeEntry(code);
	inputArea.text = "";
	
		// serialize the code string to handle quotations, newlines, etc.
	var result:String = MMExecute('jdlib.FireworksConsole.evaluateCode(' + JSON.serialize(code) + ')');
	
	print(">>> " + code, result + "\n");
} catch (e:*) {
fwlog(e.message);
}
}


// ===========================================================================
private function print(
	inPrefix:String,
	inText:String) : void
{
	if (inPrefix) {
		inPrefix = inPrefix.replace(/&/g, "&amp;");
		inPrefix = inPrefix.replace(/</g, "&lt;");
		inPrefix = inPrefix.replace(/>/g, "&gt;");
		outputArea.htmlText += '<font color="#585880">' + inPrefix + "</font>: " + inText;
	} else {
			// there's no prefix, so we don't need to deal with html-formatted text
		outputArea.text += inText;
	}
	 
	prefs.data.savedOutput = outputArea.htmlText;
	prefs.flush(90);
	
		// force the texta area to validate so we get the correct max scroll 
		// height after adding the text
	outputArea.validateNow();
	outputArea.verticalScrollPosition = outputArea.maxVerticalScrollPosition;
}


// ===========================================================================
private function setInputText(
	inText:String) : void
{
	inputArea.text = inText;
	var len:int = inputArea.text.length;
	inputArea.setSelection(len, len);
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
	outputArea.text = "";
	prefs.data.savedOutput = "";
}


// ===========================================================================
private function onTextInput(
	inEvent:TextEvent) : void
{
	var ascii:int = inEvent.text.charCodeAt(0);
	
		// don't allow newlines or returns, unless ctrl is down
	if (!key.isDown(Keyboard.CONTROL) && (ascii == 13 || ascii == 10)) {
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
			if (inEvent.altKey) {
				showPreviousCodeEntry();
			}
			break;
			
		case Keyboard.DOWN:
			if (inEvent.altKey) {
				showNextCodeEntry();
			}
			break;
	}
}


// ===========================================================================
private function onError(
	inEvent:ErrorEvent) : void
{
fwlog("Error", inEvent.text);
}


// ===========================================================================
private function onExit(
	inEvent:FlexEvent) : void
{
fwlog("exit");
	prefs.data.savedOutput = outputArea.text;
	prefs.flush(90);
}
