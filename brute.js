
function brute_system() {
	this.el = build("div");
	this.el_vars = build("div", "vars", this.el);
	this.el_generate_button = build("button", "generate_button", this.el, "Generate variations");
	this.el_sets_scroller = build("div", "set_scroller", this.el);
	this.el_sets = build("div", "sets", this.el_sets_scroller);

	this.rules = [];
	this.suitable_sets = [];
	this.equations = [];
	this.vars = {};
	this.load_vars = {};

	this.add_rule = function(rule) {
		this.rules.push(rule);
		rule.on_change = this.handle_rule_update;
		this.handle_rule_update(rule);
	}.bind(this);

	this.remove_rule = function(rule) {
		var idx = this.rules.indexOf(rule);
		this.equations.splice(idx, 1);
		this.rules.splice(idx, 1);
		this.discover_variables();
	}.bind(this);

	this.handle_rule_update = function(rule) {
		var idx = this.rules.indexOf(rule);
		var rule_str = rule.rule;
		if (rule_str == "") rule_str = "1 == 1";
		var equation = this.equations[idx] = e_math.parse(rule_str);
		this.discover_variables();
	}.bind(this);

	this.add_variable = function(key) {
		var var_obj;
		if (key in this.load_vars) {
			var_obj = this.vars[key] = this.load_vars[key];
		} else {
			var_obj = this.vars[key] = {"min" : -100, "max" : 100, "step" : 1, "substitute" : false};
		}
		 
		var el = build("div", "var", this.el_vars);
		el.setAttribute("data-var_key", key);

		var el_title = build("div", "title", el, key);
		

		var el_substitute = build("custom_checkbox", undefined, el, "substitute", var_obj.substitute);
		el_substitute.addEventListener("changed", function(e) {
			var_obj.substitute = el_substitute.value;
		});

		var el_min = build("custom_input", undefined, el, "min:", var_obj.min);
		el_min.addEventListener("changed", function(e) {
			var_obj.min = parse_float(el_min.value);
			if (var_obj.min == undefined) var_obj.min = 0;
		});

		var el_max = build("custom_input", undefined, el, "max:", var_obj.max);
		el_max.addEventListener("changed", function(e) {
			var_obj.max = parse_float(el_max.value);
			if (var_obj.max == undefined) var_obj.max = 0;
		});

		var el_step = build("custom_input", undefined, el, "step:", var_obj.step);
		el_step.addEventListener("changed", function(e) {
			var_obj.step = parse_float(el_step.value);
			if (var_obj.step == undefined) var_obj.step = 0;
		});
	}.bind(this);

	this.remove_variable = function(key) {
		var el = this.el_vars.querySelector('[data-var_key="' + key + '"]');
		this.el_vars.removeChild(el);
		delete this.vars[key];
	}.bind(this);

	this.discover_variables = function() {
		var vars = {};
		for (var i = 0; i < this.equations.length; i++) {
			var equation_vars = this.equations[i].variables();
			for (var j = 0; j < equation_vars.length; j++) {
				vars[equation_vars[j]] = 0;
			}
		}

		for (var key in vars) {
			if (!(key in this.vars)) {
				this.add_variable(key);
			}
		}

		for (var key in this.vars) {
			if (!(key in vars)) {
				this.remove_variable(key);
			}
		}
	}.bind(this);

	this.get_bool_equations = function() {
		var equations = [];
		for (var i = 0; i < this.rules.length; i++) {
			if (this.rules[i].mode == "rule") {
				equations.push(this.equations[i]);
			}
		}

		return equations;
	}.bind(this);

	this.generate_variations = function() {
		//	seed
		var vars = {};
		var var_pools = {};
		for (var key in this.vars) {
			vars[key] = 0;
			var pool = var_pools[key] = [];
			for (var i = this.vars[key].min; i <= this.vars[key].max; i+= this.vars[key].step) {
				pool.push(i);
			}
		}

		//	test each equation separately in ascending order by variable count to narrow variable pools
		var equations = this.get_bool_equations();
		equations.sort(function(a, b) {return a.variables().length - b.variables().length});
		for (var i = 0; i < equations.length; i++) {
			//	create var set
			var equation = equations[i];
			var var_keys = equation.variables();
			var vars = {};
			for (var j = 0; j < var_keys.length; j++) vars[var_keys[j]] = 0;
			
			//	test
			var suitable_sets = [];
			recursive_loop_exec(vars, var_pools, function(vars) {
				if (equation.evaluate(vars) === true) suitable_sets.push(shallow_copy(vars));
			});

			var new_pools = variations_to_pools(suitable_sets);
			for (var key in new_pools) var_pools[key] = new_pools[key];
		}

		//	test all equations together
		var suitable_sets = [];
		recursive_loop_exec(vars, var_pools, function(vars) {
			for (var i = 0; i < equations.length; i++) if (equations[i].evaluate(vars) !== true) return;
			suitable_sets.push(shallow_copy(vars));
		});

		this.suitable_sets = suitable_sets;
		this.render_sets();
	}.bind(this);
	this.el_generate_button.addEventListener("click", this.generate_variations);

	this.render_sets = function() {
		this.el_sets.innerHTML = "";
		for (var i = 0; i < Math.min(this.suitable_sets.length, 1000); i++) {
			this.el_sets.innerHTML += render_obj(this.suitable_sets[i]) + "<br>";
		}
	}.bind(this);
}

function render_obj(obj) {
	var s = "";
	for (var key in obj) {
		s += key + " : " + obj[key] + ", ";
	}
	s = s.substring(0, s.length - 2);
	return s;
}


function variations_to_pools(variations) {

	if (variations.length < 1) return {};

	var pools = {};
	for (var key in variations[0]) pools[key] = {};

	for (var i = 0; i < variations.length; i++) {
		for (var key in variations[i]) {
			var value = variations[i][key];
			pools[key][value] = value;
		}
	}

	for (var key in pools) pools[key] = Object.values(pools[key]);
	return pools;
}

function shallow_copy(obj) {
	var copy = {};
	for (var key in obj) copy[key] = obj[key];
	return copy;
}

function recursive_loop_exec(vars, var_pools, func, pass_keys) {
	if (pass_keys === undefined) pass_keys = Object.keys(vars);
	var my_key = pass_keys[0];
	var my_pool = var_pools[my_key];

	if (pass_keys.length > 1) {
		var child_keys = pass_keys.slice(1);
		for (var i = 0; i < my_pool.length; i++) {
			vars[my_key] = my_pool[i];
			recursive_loop_exec(vars, var_pools, func, child_keys);
		}
	} else {
		for (var i = 0; i < my_pool.length; i++) {
			vars[my_key] = my_pool[i];
			func(vars);
		}
	}
}

function replace_latex_var(latex, name, value) {
	latex = latex.substring(2, latex.length - 2);

	var var_palette = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
	var var_map = [];
	var escaped = false;
	var is_between = true;
	var count = 1;
	var vars = [];
	for (var i = 0; i < latex.length; i++) {
		var is_var_token = var_palette.indexOf(latex[i]) !== -1;
		var is_escape = latex[i] == "\\";

		if (escaped) {
			if (!is_var_token && !is_escape) escaped = false;
		} else {
			if (is_escape) {
				escaped = true;
			} else {
				if (is_var_token) {
					if (is_between) {
						is_between = false;
						vars.push({"start" : i, "limit" : i + 1, "token" : count});
					}
				} else {
					if (!is_between) {
						is_between = true;
						count++;
					}
				}
			}
		}
		var_map[i] = escaped ? -1 : !is_var_token ? -1 : count;
	}

	for (var i = 0; i < vars.length; i++) {
		for (var j = vars[i].limit; j < var_map.length; j++) {
			if (var_map[j] === vars[i].token) vars[i].limit = j + 1;
		}
		vars[i].name = latex.substring(vars[i].start, vars[i].limit);
	}

	var replacer = undefined;
	for (var i = 0; i < vars.length; i++) {
		if (vars[i].name == name) {
			replacer = vars[i];
			break;
		}
	}
	if (replacer === undefined) return "\\(" + latex + "\\)";

	return "\\(" + latex.substring(0, replacer.start) + value + latex.substring(replacer.limit) + "\\)";
}









