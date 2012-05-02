/* ===========================================================================
	
	File: FireworksConsole.js

	Author - John Dunning
	Copyright - 2010 John Dunning.  All rights reserved.
	Email - fw@johndunning.com
	Website - http://johndunning.com/fireworks

	Release - 0.3.0 ($Revision: 1.8 $)
	Last update - $Date: 2010/05/11 19:42:17 $

   ======================================================================== */


/*
	To do:
		- support %s in first string passed to console.log, etc.

		- check for loops and for root object so we don't keel over when 
			typing dojo into the console 

		- support assert() methods
			would have to assert the expresion in the caller's context

	Done:
		- add way to count without displaying, and then display the total later
			console.count("foo", true);
			console.countDisplay("foo");

		- use dojo instead of JSON to avoid changing prototypes

		- push strings onto array rather than append to a string?
			should be faster
			can't do it because can't return the sring from a method called by the AS?

		- add console.log() API
*/

  
jdlib = jdlib || {};


// ===========================================================================
(function()
{
	var __StringFormatter__ = {
		format: function(
			inValue,
			inDepth)
		{
			var valueType = typeof inValue;

			if (inDepth > 10) {
				return "<< MAX DEPTH REACHED >>";
			} else if (this[valueType]) {
				return this[valueType](inValue, inDepth);
			} else {
				return "UNKNOWN";
			}
		},
		
		
		"array": function(
			inArray,
			inDepth)
		{
			inDepth = inDepth || 0;
			var items = [];
		
			for (var i = 0, len = inArray.length; i < len; i++) {
				items.push(this.format(inArray[i], inDepth + 1));
			}
		
			return "[" + items.join(", ") + "]";
		},
		
		
		"object": function(
			inObject,
			inDepth,
			inAttributes)
		{
			inDepth = inDepth || 0;
			
			if (inObject == null) {
				return "null";
			} else if (inObject instanceof Array || inObject.toString() == "[object FwArray]") {
				return this["array"](inObject, inDepth);
			} else if (typeof inObject.__repr__ == "function") {
				return inObject.__repr__();
			}

			var emptyObject = {};
			var keys = [];
		
			if (typeof inAttributes == "undefined") {
				try {
					for (var attribute in inObject) {
						if (!(attribute in emptyObject)) {
							keys.push(attribute);
						}
					}
				} catch (exception) {
				}
		
				keys.sort();
			} else {
				keys = inAttributes;
			}
		
			if (keys.length == 0) {
					// don't waste 3 lines on an empty object
				return "{ }";
			}
		
			var attributes = [];
		
			for (var i = 0, len = keys.length; i < len; i++) {
				var key = keys[i];
				
					// skip javascriptString, since it's a string representation
					// of the object, which we're building ourselves
				if (key != "javascriptString") {
					attributes.push(key + ": " + this.format(inObject[key], inDepth + 1));
				}
			}
			
			var tabs = "\t";
			while (inDepth-- > 0) { tabs += "\t"; }
			
			if (attributes.length < 5) {
				var result = "{ " + attributes.join(", ") + " }";
			} else {
				var result = ["{\n", tabs, attributes.join(",\n" + tabs), "\n", tabs.slice(1), "}"].join("");
			}
			
			return result;
		},
		
		
		"string": function(
			inString)
		{
			return '"' + inString + '"';
		},
		
		
		"number": function(
			inNumber)
		{
			return inNumber.toString();
		},
		
		
		"boolean": function(
			inBoolean)
		{
			return inBoolean.toString();
		},
		
		
		"function": function(
			inFunction)
		{
			return "function() {...}";
		},
		
		
		"undefined": function()
		{
			return "undefined";
		}
	};
	
	
	function useDojo()
	{
		if (typeof dojo == "undefined") { fw.runScript("lib/dojo/dojo.js"); }
	}

	
	function extractCallerName(
		inCaller)
	{
		var callerName = "";

		try {
			callerName = inCaller.NAME;

			if (typeof callingFunction == "undefined" || callerName == "") {
					// convert the function to a string, which should include
					// the name if it's not an anonymous function
				callerName = inCaller.toString().match(/^\s*function ([^)]+)\(/)[1];
			}
		} catch (exception) {
			callerName = "";
		}

		return callerName;
	}


	function evaluateCode(
		inCode)
	{
		var dom = fw.getDocumentDOM();
		var sel = fw.selection;
		var __e__;
		var __r__;
		
		try {
			__r__ = __StringFormatter__.format(eval(inCode));
		} catch (__e__) {
			__r__ = __e__.toString();
		}
		
		return __r__;
	}


	jdlib.FireworksConsole = {
		version: "$Revision: 1.8 $".match(/ ([0-9.]+) /)[1],
		evaluateCode: evaluateCode
	};


		// embed a local copy of the dojo JSON library, which has been changed
		// to not depend on any other part of dojo.  that way, we don't have to
		// rely on external libraries.  unlike Crockford's library, the dojo
		// implementation doesn't change the prototypes of basic types, which
		// caused problems for the Path panel, and possibly others.
	var dojo = {};

	dojo.fromJson = function(/*String*/ json){
		return eval("(" + json + ")"); // Object
	}

	dojo._escapeString = function(/*String*/str){
		return ('"' + str.replace(/(["\\])/g, '\\$1') + '"').
			replace(/[\f]/g, "\\f").replace(/[\b]/g, "\\b").replace(/[\n]/g, "\\n").
			replace(/[\t]/g, "\\t").replace(/[\r]/g, "\\r"); // string
	}

	dojo.toJsonIndentStr = "\t";
	dojo.toJson = function(/*Object*/ it, /*Boolean?*/ prettyPrint, /*String?*/ _indentStr){
		if(it === undefined){
				// dojo was incorrectly returning "undefined" here
			return undefined;
		}
		var objtype = typeof it;
		if(objtype == "number" || objtype == "boolean"){
			return it + "";
		}
		if(it === null){
			return "null";
		}
		if(typeof it == "string" || it instanceof String){
			return dojo._escapeString(it);
		}
		// recurse
		var recurse = arguments.callee;
		// short-circuit for objects that support "json" serialization
		// if they return "self" then just pass-through...
		var newObj;
		_indentStr = _indentStr || "";
		var nextIndent = prettyPrint ? _indentStr + dojo.toJsonIndentStr : "";
		var tf = it.__json__||it.json;
		if(typeof tf == "function"){
			newObj = tf.call(it);
			if(it !== newObj){
				return recurse(newObj, prettyPrint, nextIndent);
			}
		}
		if(it.nodeType && it.cloneNode){ // isNode
			// we can't seriailize DOM nodes as regular objects because they have cycles
			// DOM nodes could be serialized with something like outerHTML, but
			// that can be provided by users in the form of .json or .__json__ function.
			throw new Error("Can't serialize DOM nodes");
		}

		var sep = prettyPrint ? " " : "";
		var newLine = prettyPrint ? "\n" : "";

		// array
		if(it && it instanceof Array){
			var res = [];
			for (var i = 0, len = it.length; i < len; i++) {
				var val = recurse(it[i], prettyPrint, nextIndent);
				if(typeof val != "string"){
						// dojo was incorrectly returning "undefined" here
					val = undefined;
				}
				res[i] = newLine + nextIndent + val;
			}
			return "[" + res.join("," + sep) + newLine + _indentStr + "]";
		}
		if(objtype == "function"){
			return null; // null
		}
		// generic object code path
		var output = [], key;
		for(key in it){
			var keyStr, val;
			if(typeof key == "number"){
				keyStr = '"' + key + '"';
			}else if(typeof key == "string"){
				keyStr = dojo._escapeString(key);
			}else{
				// skip non-string or number keys
				continue;
			}
			val = recurse(it[key], prettyPrint, nextIndent);
			if(typeof val != "string"){
				// skip non-serializable values
				continue;
			}
			// FIXME: use += on Moz!!
			//	 MOW NOTE: using += is a pain because you have to account for the dangling comma...
			output.push(newLine + nextIndent + keyStr + ":" + sep + val);
		}
		return "{" + output.join("," + sep) + newLine + _indentStr + "}"; // String
	}


	var _counts = {},
		_timers = {};


	function now()
	{
		return (new Date()).getTime();
	}


	function addLogEntry(
		inType,
		inCaller)
	{
		if (arguments.length < 3) {
			return;
		}

		var s = [];
		
		for (var i = 2, len = arguments.length; i < len; i++) {
			var variant = arguments[i];

			if (typeof variant == "string") {
					// we don't use the string StringFormatter here because we don't
					// want double quotes around strings when calling log("here's a string");
				s.push(variant);
			} else {
				s.push(__StringFormatter__.format(variant));
			}
		}

			// due to the annoying-as-fuck modal "processing command" dialog that
			// will appear on top of FW and require a force-quit if the call stack
			// gets more than one or two levels deep, we can't delay the conversion
			// of the log entries to JSON until the console polls for the latest
			// entries.  so we have to convert the parameters to a JSON string
			// now, and push the string onto an array.  ffs.
		console._logEntries.push(dojo.toJson({
			type: inType,
			text: s.join(" "),
			caller: extractCallerName(inCaller),
			time: now()
		}));

			// keep only the last 50 log entries, in case the console panel
			// isn't picking them up
		console._logEntries = console._logEntries.slice(-50);
	}


	console = {
			// we need to set this so dojo doesn't wipe out the console object
			// if it loads after us
		firebug: true,

			// this array stores the JSON strings until the panel wants them
		_logEntries: [],
		
			// this string temporarily holds the JSON string version of the
			// _logEntries array
		_logEntriesJSON: "",


		_prepLogEntriesJSON: function()
		{
			var entries = this._logEntries;

				// clear the array, so that we don't redisplay old entries
			this._logEntries = [];

				// convert the array to JSON and store it on a property of
				// console.  due to the motherless-whore processing dialog, we
				// can't simply return this string to the panel.  instead, the
				// panel has to call this method and then access
				// console._logEntriesJSON to get the JSON string.
			this._logEntriesJSON = "[" + entries.join(",") + "]";
		},


		time: function(
			inTimerName)
		{
			_timers[inTimerName] = now()
		},


		timeEnd: function(
			inTimerName)
		{
			if (_timers[inTimerName]) {
				var delta = now() - _timers[inTimerName];
				addLogEntry("log", arguments.callee.caller, inTimerName + ":", delta / 1000, "sec");
				delete _timers[inTimerName];
			}
		},


		count: function(
			inCountName,
			inSuppressDisplay)
		{
			if (!_counts[inCountName]) {
				_counts[inCountName] = 0;
			}

			_counts[inCountName]++;

			if (!inSuppressDisplay) {
				addLogEntry("log", arguments.callee.caller, inCountName + ":", _counts[inCountName]);
			}
		},


		countDisplay: function(
			inCountName,
			inReset)
		{
			if (_counts[inCountName]) {
				addLogEntry("log", arguments.callee.caller, inCountName + ":", _counts[inCountName]);

				if (inReset) {
					delete _counts[inCountName];
				}
			}
		},


		countReset: function(
			inCountName)
		{
			delete _counts[inCountName];
		},


		clear: function()
		{
			_logEntriesJSON = "";
		}
	};

		// create functions that pass different types to addLogEntry
	for (var functionName in { log:1, warn:1, info:1, debug:1, error:1 }) {
		console[functionName] = (function(inFunctionName) {
			return function()
				{
						// pass our caller in so that addLogEntry can extract
						// its name
					addLogEntry.apply(this, [inFunctionName, arguments.callee.caller].concat(arguments));
				};
		})(functionName);
	}

		// create functions that print error messages for unsupported methods
	for (var functionName in { trace:1, dir:1, dirxml:1, group:1, groupEnd:1, profile:1, profileEnd:1 }) {
		console[functionName] = (function(inFunctionName) {
			return function() { console.error("*** console." + inFunctionName + "() is not currently supported ***"); };
		})(functionName);
	}

	log = console.log;
})();
