/* ===========================================================================
	
	File: FireworksConsole.js

	Author - John Dunning
	Copyright - 2007 John Dunning.  All rights reserved.
	Email - fw@johndunning.com
	Website - http://johndunning.com/fireworks

	Release - 0.2.0 ($Revision$)
	Last update - $Date$

   ======================================================================== */


/*
	To do:
		- support %s in first string passed to console.log, etc.

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

			if (this[valueType]) {
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
		version: "$Revision$".match(/ ([0-9.]+) /)[1],
		evaluateCode: evaluateCode
	};


		// include the Crockford JSON stringify instead of relying on dojo
	var JSON = {};
	(function()
	{
		function f(n) {
			return n < 10 ? '0' + n : n;
		}

		if (typeof Date.prototype.toJSON !== 'function') {
			Date.prototype.toJSON = function (key) {

				return isFinite(this.valueOf()) ?
					   this.getUTCFullYear()   + '-' +
					 f(this.getUTCMonth() + 1) + '-' +
					 f(this.getUTCDate())      + 'T' +
					 f(this.getUTCHours())     + ':' +
					 f(this.getUTCMinutes())   + ':' +
					 f(this.getUTCSeconds())   + 'Z' : null;
			};

			String.prototype.toJSON =
			Number.prototype.toJSON =
			Boolean.prototype.toJSON = function (key) {
				return this.valueOf();
			};
		}

		var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
			escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
			gap,
			indent,
			meta = {    // table of character substitutions
				'\b': '\\b',
				'\t': '\\t',
				'\n': '\\n',
				'\f': '\\f',
				'\r': '\\r',
				'"' : '\\"',
				'\\': '\\\\'
			},
			rep;


		function quote(string) {
			escapable.lastIndex = 0;
			return escapable.test(string) ?
				'"' + string.replace(escapable, function (a) {
					var c = meta[a];
					return typeof c === 'string' ? c :
						'\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
				}) + '"' :
				'"' + string + '"';
		}


		function str(key, holder) {
			var i,          // The loop counter.
				k,          // The member key.
				v,          // The member value.
				length,
				mind = gap,
				partial,
				value = holder[key];

			if (value && typeof value === 'object' &&
					typeof value.toJSON === 'function') {
				value = value.toJSON(key);
			}

			if (typeof rep === 'function') {
				value = rep.call(holder, key, value);
			}

			switch (typeof value) {
				case 'string':
					return quote(value);

				case 'number':
					return isFinite(value) ? String(value) : 'null';

				case 'boolean':
				case 'null':
					return String(value);

				case 'object':
					if (!value) {
						return 'null';
					}

					gap += indent;
					partial = [];

					if (Object.prototype.toString.apply(value) === '[object Array]') {
						length = value.length;
						for (i = 0; i < length; i += 1) {
							partial[i] = str(i, value) || 'null';
						}

						v = partial.length === 0 ? '[]' :
							gap ? '[\n' + gap +
									partial.join(',\n' + gap) + '\n' +
										mind + ']' :
								  '[' + partial.join(',') + ']';
						gap = mind;
						return v;
					}

					if (rep && typeof rep === 'object') {
						length = rep.length;
						for (i = 0; i < length; i += 1) {
							k = rep[i];
							if (typeof k === 'string') {
								v = str(k, value);
								if (v) {
									partial.push(quote(k) + (gap ? ': ' : ':') + v);
								}
							}
						}
					} else {
						for (k in value) {
							if (Object.hasOwnProperty.call(value, k)) {
								v = str(k, value);
								if (v) {
									partial.push(quote(k) + (gap ? ': ' : ':') + v);
								}
							}
						}
					}

					v = partial.length === 0 ? '{}' :
						gap ? '{\n' + gap + partial.join(',\n' + gap) + '\n' +
								mind + '}' : '{' + partial.join(',') + '}';
					gap = mind;
					return v;
			}
		}

		JSON.stringify = function (value, replacer, space) {
			var i;
			gap = '';
			indent = '';

			if (typeof space === 'number') {
				for (i = 0; i < space; i += 1) {
					indent += ' ';
				}
			} else if (typeof space === 'string') {
				indent = space;
			}

			rep = replacer;
			if (replacer && typeof replacer !== 'function' &&
					(typeof replacer !== 'object' ||
					 typeof replacer.length !== 'number')) {
				throw new Error('JSON.stringify');
			}

			return str('', {'': value});
		};
	})();


	var _counts = {};
	var _timers = {};


	function _now()
	{
		return (new Date()).getTime();
	}


	function _addLogEntry(
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
		
		var entryJSON = JSON.stringify({
			type: inType,
			text: s.join(" "),
			caller: inCaller,
			time: _now()
		});

		if (console._logEntriesJSON.length > 0) {
			console._logEntriesJSON += ",";
		}

		console._logEntriesJSON += entryJSON;
	}


	console = {
		_logEntriesJSON: "",

			// we need to set this so dojo doesn't wipe out the console object
			// if it loads after us
		firebug: true,

		time: function(
			inTimerName)
		{
			_timers[inTimerName] = _now()
		},

		timeEnd: function(
			inTimerName)
		{
			if (_timers[inTimerName]) {
				var delta = _now() - _timers[inTimerName];
				console.log(inTimerName + ":", delta / 1000, "sec");
				delete _timers[inTimerName];
			}
		},

		count: function(
			inCountName)
		{
			if (!_counts[inCountName]) {
				_counts[inCountName] = 0;
			}

			_counts[inCountName]++;
			console.log(inCountName + ":", _counts[inCountName]);
		},

		clear: function()
		{
			_logEntriesJSON = "";
		}
	};

		// create functions that pass different types to _addLogEntry
	for (var functionName in { log:1, warn:1, info:1, debug:1, error:1 }) {
		console[functionName] = (function(inFunctionName) {
			return function()
				{
						// we have to capture the calling function's name here,
						// rather than in _addLogEntry, since that function sees
						// its caller as apply()
					var callingFunction = "";

					try {
						callingFunction = arguments.callee.caller.NAME;

						if (typeof callingFunction == "undefined" || callingFunction == "") {
							callingFunction = arguments.callee.caller.toString().match(/^\s*function ([^)]+)\(/)[1];
						}
					} catch (exception) {
						callingFunction = "";
					}
					
					_addLogEntry.apply(this, [inFunctionName, callingFunction].concat(arguments));
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
