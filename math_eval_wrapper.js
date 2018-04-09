

//	init MJX
(function(){
	window.mathjax_refresh = function() { console.log("mathjax not yet loaded, postponing"); }

	function mathjax_checkload() {
		if ("MathJax" in window) {
			window.mathjax_refresh = function() {MathJax.Hub.Typeset();};
			window.mathjax_refresh();
		} else {
			setTimeout(mathjax_checkload, 1);
		}
	}

	
	function mathjax_lazyload() {
		if ("body" in document && document.body !== null) {
			var mjdyna = build("script");
			mjdyna.src = "https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.2/MathJax.js?config=TeX-MML-AM_CHTML";
			document.body.appendChild(mjdyna);
			mathjax_checkload();
		} else {
			setTimeout(mathjax_lazyload, 1);
		}
	};

	mathjax_lazyload();
})();

//	initialize VME
(function(){

	var show_vme = function(){};

	function vme_load() {
		var drupal = window.Drupal || window.parent.Drupal;
		var vme_frame = build("iframe");
		vme_frame.style = "width:100%;height:100%";
		vme_frame.src = drupal.settings.basePath + "sites/all/modules/x_ck_math/ck_vme/VisualMathEditor/VisualMathEditor.html?runLocal";

		var vme_floater = new floater(vme_frame, "Visual Math Editor", undefined, undefined, 800, 600);

		var vme_callback = undefined;

		show_vme = function(equation, callback) {
			vme_callback = callback;
			vme_floater.show();
			vme_floater.center();
			equation = equation || "";

			var ltx_start = equation.indexOf("\\(");
			var ltx_end = equation.indexOf("\\)");
			if (ltx_start !== -1 && ltx_end !== -1) equation = equation.substring(ltx_start + 2, ltx_end);
			vme_frame.contentWindow.vme.codeMirrorEditor.setValue(equation);
		};


		vme_floater.add_button("ok", function() {
			if (vme_callback !== undefined) vme_callback("\\(" + vme_frame.contentWindow.vme.codeMirrorEditor.getValue() + "\\)");
			vme_floater.hide();
		});

		vme_floater.add_button("cancel", vme_floater.hide);

		vme_floater.hide();
	}

	function vme_lazyload() {
		if ("body" in document && document.body !== null) {
			vme_load();
		} else {
			setTimeout(vme_lazyload, 1);
		}
	}

	vme_lazyload();

	window.build_equation_box = function(parent) {
		var el = build("div", "equation_box", parent);
		el.setAttribute("data-equation", "");

		el.set_equation = function(eq) {
			el.innerText = eq;
			el.setAttribute("data-equation", eq);
			mathjax_refresh();
		}

		var changed_event = new Event("changed");

		var finish_modify_handler = function(eq) {
			el.set_equation(eq);
			el.dispatchEvent(changed_event, eq);
		};

		var start_modify_handler = function() {
			var eq = el.getAttribute("data-equation") || "";
			show_vme(eq, finish_modify_handler);
		};

		el.addEventListener("click", start_modify_handler);

		return el;
	}

})();



//	rule editor

function rule_editor(exercise_host) {
	this.exercise_host = exercise_host;

	this.el = build("div", "rule");
	this.el_dropdown = build("custom_dropdown", undefined, this.el, {"rule" : "Visible rule", "hidden_rule" : "Hidden rule", "question" : "Question"});
	this.el_inner = build("div", "inner", this.el);
	this.el_rule = build_equation_box(this.el_inner);
	this.el_remove_button = build("button", "remove_button", this.el, "Remove");

	this.el_remove_button.addEventListener("click", function() {
		if (this.exercise_host === undefined) return;
		this.exercise_host.remove_rule(this);
	}.bind(this));

	this._mode = undefined;

	Object.defineProperty(this, "mode", {
		"get" : function() {
			return this._mode;
		}.bind(this),
		"set" : function(v) {
			this.el_dropdown.set_value(v);
			this._mode = v;
		}.bind(this)
	});

	Object.defineProperty(this, "rule", {
		"get" : function() {
			return this.el_rule.getAttribute("data-equation");
		}.bind(this),
		"set" : function(v) {
			this.el_rule.set_equation(v);
		}.bind(this)
	});

	this.on_change = function(){};

	this.el_dropdown.addEventListener("changed", function(e) { this.mode = e.detail; }.bind(this));
	this.el_rule.addEventListener("changed", function(e) {
		this.on_change(this);
	}.bind(this));
	this.mode = "rule";

	Object.defineProperty(this, "data", {
		"get" : function() {
			return {"mode" : this.mode, "rule" : this.rule};
		}.bind(this),
		"set" : function(v) {
			this.mode = v.mode;
			this.rule = v.rule;
		}.bind(this)
	});
};

//	exercise editor

function exercise_editor(wrapper) {
	this.wrapper = wrapper;
	this.el = build("div", "exercise_editor");

	build("span", "sublabel", this.el, "Description");
	this.el_description = build("textarea", "description", this.el);

	build("span", "sublabel", this.el, "Rules");		
	this.el_rules = build("div", "rules", this.el);
	this.el_add_button = build("button", undefined, this.el, "Add Rule");

	this.rules = [];
	this.brute_system = new brute_system();
	this.el.appendChild(this.brute_system.el);

	this.add_rule = function() {
		var rule = new rule_editor(this, this.mode);
		this.rules.push(rule);
		this.el_rules.appendChild(rule.el);
		this.brute_system.add_rule(rule);
		return rule;
	}.bind(this);


	this.remove_rule = function(rule) {
		this.el_rules.removeChild(rule.el);
		this.rules.splice(this.rules.indexOf(rule), 1);
		this.brute_system.remove_rule(rule);
	}.bind(this);

	this.clear = function() {
		this.el_description.value = "";
		for (var i = 0; i < this.rules.length; i++) {
			this.remove_rule(this.rules[i]);
		}
	}.bind(this);

	
	this.el_add_button.addEventListener("click", this.add_rule);
	this.add_rule();

	Object.defineProperty(this, "data", {
		"get" : function() {
			var ret = {"description" : this.el_description.value, "rules" : [], "suitable_sets" : this.brute_system.suitable_sets, "variables" : this.brute_system.vars};
			for (var i = 0; i < this.rules.length; i++) {
				ret.rules.push(this.rules[i].data);
			}
			return ret;
		}.bind(this),
		"set" : function(v) {
			this.clear();
			this.el_description.value = v.description;
			this.brute_system.suitable_sets = v.suitable_sets || [];
			this.brute_system.render_sets();
			this.brute_system.load_vars = v.variables || [];
			
			for (var i = 0; i < v.rules.length; i++) {
				var rule = this.add_rule();
				rule.data = v.rules[i];
				this.brute_system.handle_rule_update(rule);
			}
		}.bind(this)
	});
};

//	exercise viewer

function exercise_viewer(wrapper) {
	this.wrapper = wrapper;
	this.el = build("div", "exercise_viewer");
	this.el_description = build("div", "description", this.el);
	this.el_rules = build("div", "rules", this.el);
	this.el_questions = build("div", "questions", this.el);
	this.el_check = build("button", "check_button", this.el, "Check");
	this.vars = {};
	this.set = {};
	this.rules = [];

	this.add_rule = function(rule) {
		this.rules.push(rule);
		var equation = e_math.parse(rule.rule);
		for (var i = 0; i < equation.tokens.length; i++) {
			if (equation.tokens[i].type === "IVAR" && equation.tokens[i].value in this.vars && this.vars[equation.tokens[i].value].substitute === true) {
				rule.rule = replace_latex_var(rule.rule, equation.tokens[i].value, this.set[equation.tokens[i].value]);
				equation.tokens[i].type = "INUMBER";
				equation.tokens[i].value = this.set[equation.tokens[i].value];	
			}
		}
		
		var el = build("div", "rule", this.el_rules);
		var el_equation = build("div", "equation", el, rule.rule);
		if (rule.mode == "question") {
			build("div", undefined, el, "\\(=\\)");
			var el_answer = build_equation_box(el);
			rule.el_answer = el_answer;
		}
		window.mathjax_refresh();
	}.bind(this);

	this.check_answers = function() {
		var good = true;
		for (var i = 0; i < this.rules.length; i++) {
			if (this.rules[i].mode == "question") {
				var lhs = this.rules[i].rule;
				if (lhs.length > 2) {
					lhs = lhs.substring(0, lhs.length - 2);
				} else {
					lhs = "\\(undefined";
				}

				var rhs = this.rules[i].el_answer.getAttribute("data-equation");
				if (rhs.length > 2) {
					rhs = rhs.substring(2);
				} else {
					rhs = "undefined\\)";
				}

				var bool = lhs + "==" + rhs;

				if (e_math.eval(bool, this.set) == true) {
					this.rules[i].el_answer.setAttribute("data-correct", "");
					this.rules[i].el_answer.removeAttribute("data-incorrect");
				} else {
					this.rules[i].el_answer.setAttribute("data-incorrect", "");
					this.rules[i].el_answer.removeAttribute("data-correct");
				}
			}
		}


	}.bind(this);
	this.el_check.addEventListener("click", this.check_answers);

	Object.defineProperty(this, "data", {
		"get" : function() {
			return this._data;
		}.bind(this),
		"set" : function(v) {
			this._data = v;
			this.set = {};
			this.vars = v.variables;
			if (v.suitable_sets.length > 0) {
				this.set = v.suitable_sets[Math.floor(v.suitable_sets.length * Math.random())];
			} else {
				this.el.innerHTML = "Variable sets not generated, post-generate not implemented";
				return;
			}
			this.el_description.innerHTML = v.description;
			console.log(this.set);
			for (var i = 0; i < v.rules.length; i++) {
				this.add_rule(v.rules[i]);
			}
		}.bind(this)
	});
}

//	wrapper

function math_eval_wrapper(mode) {
	this.el = build("div", "math_eval_wrapper");
	this.el_exercises = build("div", "exercises", this.el);
	this.mode = mode || "editor";
	this.exercises = [];

	this.add_exercise = function() {
		if (this.mode == "editor") {
			var exercise = new exercise_editor(this);
			this.exercises.push(exercise);
			this.el_exercises.appendChild(exercise.el);
			return exercise;
		} else {
			var exercise = new exercise_viewer(this);
			this.exercises.push(exercise);
			this.el_exercises.appendChild(exercise.el);
			return exercise;
		}
	}.bind(this);

	this.remove_exercise = function(exercise) {
		this.el_exercises.removeChild(exercise.el);
		this.exercises.splice(this.exercises.indexOf(exercise), 1);
	}.bind(this);

	this.clear = function() {
		for (var i = 0; i < this.exercises.length; i++) {
			this.remove_exercise(this.exercises[i]);
		}
	}.bind(this);

	Object.defineProperty(this, "data", {
		'get' : function() {
			if (this.mode == "viewer") return this._data;

			var ret = {"exercises" : []};
			for (var i = 0; i < this.exercises.length; i++) {
				ret.exercises.push(this.exercises[i].data);
			}
			return ret;
		},
		'set' : function(v) {
			this._data = v;
			this.clear();

			if (v === undefined && this.mode == "editor") {
				this.add_exercise();
				return;
			}

			for (var i = 0; i < v.exercises.length; i++) {
				this.add_exercise().data = v.exercises[i];
			}
		}
	});


}





