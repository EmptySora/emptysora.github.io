
function findIndexLongest(arr,args,cond,comparator) {
    var i;
    var pindex = -1;
    for (i = 0; i < arr.length; i += 1) {
        if (cond(arr[i],...args)) {
            if ((pindex === -1) || comparator(arr[pindex],arr[i])) {
                pindex = i;
            }
        }
    }
    return pindex;
    //this = array separators
    //arg0 = bool comparator(object)
    //            this[i]
}
function splitAllNoRemove(str, ...separators) {
    //splits str into substrings deliminated by any of the separators
    //the separator that split the substring is inserted between the two halves
    //ie: "abc.def,ghi",".","," would return ["abc",".","def",",","ghi"];
    var ret = [];
    var tmp = "";
    var sub = "";
    var i = 0;
    var j = 0;
    for (i = 0; i < str.length; i += 1) {
        sub = str.substr(i);
        j = findIndexLongest(separators,[sub], function cond(separator, sub) {
            return sub.startsWith(separator);
        }, function comparator(va, vb) {
            return vb.length > va.length;
        });
        //do this to determine which separator matches the most of the input
        if (j !== -1) {
            //one of the substrings is a hit,
            if (tmp.length > 0) {
                ret.push(tmp);
                tmp = "";
            }
            ret.push(separators[j]); //add the separator
            i += separators[j].length - 1; //offset the index by the length of the
            //separator
        } else {
            tmp += str[i];
        }
    }
    if (tmp.length > 0) {
        ret.push(tmp);
    }
    return ret;
}
function parseExpression(expression) {
    var keywords = ["ctrl","shift","alt","meta","repeat","false","true"];
    var operators = ["!","&&","||","(",")"];
    var replacements = [ //null = wildcard (or "a" below)
        [[]                        ,["true"]],
        [["!","!"]                 ,[]],
        [["!","false"]             ,["true"]],
        [["!","true"]              ,["false"]],
        
        [[ "!",   null,"&&",   null     ],["false"     ]],
        [[        null,"&&",    "!",null],["false"     ]],
        [[ "!",   null,"&&",    "!",null],[    "!",null]],
        [[        null,"&&",   null     ],[   null     ]],
        
        [[        null,"||",   null     ],[   null     ]],
        [[ "!",   null,"||",    "!",null],[    "!",null]],
        [[        null,"||",    "!",null],[ "true"     ]],
        [[ "!",   null,"||",   null     ],[ "true"     ]],
        
        [[     "false","||",   null     ],[   null     ]],
        [[     "false","||",    "!",null],[    "!",null]],
        [[      "true","||",   null     ],[ "true"     ]],
        [[      "true","||",    "!",null],[ "true"     ]],
        [[ "!",   null,"||",    "!",null],[    "!",null]],
        
        [[        null,"||","false"     ],[   null     ]],
        [[ "!",   null,"||","false"     ],[    "!",null]],
        [[        null,"||", "true"     ],[ "true"     ]],
        [[ "!",   null,"||", "true"     ],[ "true"     ]],
        
        [[     "false","&&",   null     ],["false"     ]],
        [[     "false","&&",    "!",null],["false"     ]],
        [[      "true","&&",   null     ],[   null     ]],
        [[      "true","&&",    "!",null],[    "!",null]],
        
        [[        null,"&&","false"     ],["false"     ]],
        [[ "!",   null,"&&","false"     ],["false"     ]],
        [[        null,"&&", "true"     ],[   null     ]],
        [[ "!",   null,"&&", "true"     ],[    "!",null]],
        
        [[     "false","&&","false"     ],["false"     ]],
        [[     "false","&&", "true"     ],["false"     ]],
        [[      "true","&&","false"     ],["false"     ]],
        [[      "true","&&", "true"     ],[ "true"     ]],
        
        [[     "false","||","false"     ],["false"     ]],
        [[     "false","||", "true"     ],[ "true"     ]],
        [[      "true","||","false"     ],[ "true"     ]],
        [[      "true","||", "true"     ],[ "true"     ]],
    ];
    function replaceNested(array, search, replace) {
        function obj_equals(a,b) {
            var keys_a = Object.keys(a);
            var keys_b = Object.keys(b);
            if (keys_a.length !== keys_b.length) {
                return false;
            }
            var i;
            var key;
            var _a;
            var _b;
            for (i = 0; i < keys_a.length; i += 1) {
                key = keys_a[i];
                _a = a[key];
                _b = b[key];
                if (keys_b.indexOf(key) === -1) {
                    return false;
                }
                if (_a === _b) {
                    continue;
                }
                if (typeof _a !== typeof _b) {
                    return false;
                } else if (_a instanceof Array !== _b instanceof Array) {
                    return false;
                } else if (_a instanceof Array) {
                    if (!equals(_a,0,_b)) {
                        return false;
                    }
                } else if (typeof _a === "object") {
                    if (_a === _b) {
                        continue; //reference equal
                    } else {
                        if (!obj_equals(_a,_b)) {
                            return false;
                        }
                    }
                }
            }
            return true;
        }
        function equals(a,index,b) {
            var i;
            var j = index;
            var _a;
            var _b;
            for (i = 0; i < b.length; i += 1, j += 1) {
                _a = a[j];
                _b = b[i];
                if (typeof _a !== typeof _b) {
                    return false;
                } else if (_a instanceof Array !== _b instanceof Array) {
                    return false;
                } else if (_a instanceof Array) {
                    if (!equals(_a,0,_b)) {
                        return false;
                    }
                } else if (typeof _a === "object") {
                    if (_a === _b) {
                        continue; //reference equal
                    } else {
                        if (!obj_equals(_a,_b)) {
                            return false;
                        }
                    }
                }
            }
            return true;
        }
        function matches(a,index,b) {
            var i;
            var j = index;
            var a_len = a.length - index;
            var _a;
            var _b;
            var _wildcard = null;
            if (a_len < b.length) {
                return false; //can't possibly match
            }
            for (i = 0; i < b.length; i += 1, j += 1) {
                _a = a[j];
                _b = b[i];
                if (_b !== null) {
                    if (_a !== _b) {
                        return false; //#noMatch
                    }
                } else {
                    if (_wildcard === null) {
                        _wildcard = _a;
                    }
                }
            }
        }
        //use "null" to represent a wildcard
        var i;
        for (i = 0; i < array.length; i += 1) {
            
        }
    }
    //precedence:
    //( )
    //!
    //&& ||
    //example: (!a && b || c) || d === (((!a) && b) || c) || d
    //()       === true
    //!a &&  a === false
    // a && !a === false
    //!a && !a === !a
    // a &&  a === a
    // a ||  a ===  a
    //!a || !a === !a
    // a || !a === true
    //!a ||  a === true
    //false ||  a === a
    //false || !a === !a
    //true  ||  a === true
    //true  || !a === true
    // a || false === a
    //!a || false === !a
    // a || true  === true
    //!a || true  === true
    // a && false === false
    //!a && false === false
    // a && true  === a
    //!a && true  === !a
    //
    //(!a && b) || 
    /* (a==false, b ==true), else==false
    !a FT
        F  T
     T  F  T
     F  F  F
    */
    //
    function nestExpression(parts, state) {
        var ret = [];
        var ep = false;
        if (typeof state !== "object") {
            state = {"i":0}; //object hack for byref
        }
        for (; state.i < parts.length; state.i += 1) {
            if (parts[state.i] === "(") {
                state.i += 1;
                ret.push(nestExpression(parts,state));
                if (state.reason !== "PAREN") {
                    throw new Error("Parser Error: unterminated grouping operator");
                }
                state.i -= 1;
            } else if (parts[state.i] === ")") {
                state.reason = "PAREN";
                ep = true;
                state.i += 1;
                break;
            } else {
                ret.push(parts[state.i]);
            }
        }
        if (!ep) {
            state.reason = "END";
        }
        return ret;
    }
    function assertSymbolSequenceValid(sequence) {
        
    }
    var str = expression.toLowerCase().replace(/[^a-z\!\&\|\(\)]/g,"");
    var expression_original = splitAllNoRemove(str, ...operators);
    var symbol;
    var nested_expression;
    var i;
    var optimized = true;
    var stack = [];
    var reference = null;
    var symbol_list = [];
    var cop_out = false;
    try {
        for (i = 0; i < expression_original.length; i += 1) {
            symbol = expression_original[i];
            if ((keywords.indexOf(symbol) === -1) && (operators.indexOf(symbol) === -1)) {
                throw new Error("Parser Error: unrecognized symbol '" + symbol + "'.");
            }
        }
        nested_expression = nestExpression(expression_original);
        //optimize the expression, 
        while (optimized) {
            optimized = false;
            //arrays are also optimized
            stack.push([0,nested_expression,[]]);
            while (stack.length > 0) {
                symbol = stack.pop();
                reference = symbol[1];
                symbol_list = symbol[2];
                for (i = symbol[0]; i < reference.length; i += 1) {
                    if (reference[i] instanceof Array) {
                        if (reference[i].length === 0) {
                            optimized = true;
                            reference[i] = "true";
                            cop_out = true;
                            break;
                        } else if (reference[i].length === 1) {
                            optimized = true;
                            reference[i] = reference[i][0];
                            cop_out = true;
                            break;
                        } else {
                            symbol_list.push(null);
                            stack.push([i,reference,symbol_list]);
                            stack.push([0,reference[i],[]]);
                            continue;
                        }
                        
                    } else {
                        symbol_list.push(reference[i]);
                    }
                }
                if (cop_out) {
                    break;
                }
                assertSymbolSequenceValid(symbol_list);
                //verify the sequence of symbols is actually valid.
                
                //ended the list
                //check
                if(symbol_list.some(function (symbol) {
                    return symbol === null;
                })) {
                    continue; //symbol list contains a "null" meaning the list
                    //is dependent on a subexpression.
                } else {
                    //symbol list has no nulls.
                    //detect any sequences of symbols that could be simplified.
                    //eg: no symbols === TRUE always
                    //!a && a === FALSE always
                }
            }

            stack = []; //clear stack
            cop_out = false;
        }
    } catch (e) {
        console.error(e);
        return null;
    }
    //js spread/rest args are cool... and a life saver.
    //str should only contain letters and "!&|("
    //(!ctrl||shift) ==> "(" "!" "ctrl" "||" "shift" ")"
    
}
