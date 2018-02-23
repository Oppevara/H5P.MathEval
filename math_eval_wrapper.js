
var mjdyna = build("script");
mjdyna.src = "https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.2/MathJax.js?config=TeX-MML-AM_CHTML";
document.body.appendChild(mjdyna);

function math_eval_wrapper(mode) {
	this.el = build("div", "math_eval_wrapper");
	this.el_exercises = build("div", "exercises", this.el);
	this.mode = mode || "editor";


	//	initialize VME
	(function(){
		var drupal = window.Drupal || window.parent.Drupal;
		var vme_frame = build("iframe");
		vme_frame.style = "width:100%;height:100%";
		vme_frame.src = drupal.settings.basePath + "sites/all/modules/x_ck_math/ck_vme/VisualMathEditor/VisualMathEditor.html?runLocal";
		this.vme_floater = new floater(vme_frame, "Visual Math Editor", undefined, undefined, 800, 600);

		this.vme_callback = undefined;

		this.show_vme = function(equation, callback) {
			this.vme_callback = callback;
			this.vme_floater.show();
			this.vme_floater.center();
			equation = equation || "";

			var ltx_start = equation.indexOf("\\(");
			var ltx_end = equation.indexOf("\\)");
			if (ltx_start !== -1 && ltx_end !== -1) equation = equation.substring(ltx_start + 2, ltx_end);
			vme_frame.contentWindow.vme.codeMirrorEditor.setValue(equation);
		}.bind(this);


		this.vme_floater.add_button("ok", function() {
			if (this.vme_callback !== undefined) this.vme_callback("\\(" + vme_frame.contentWindow.vme.codeMirrorEditor.getValue() + "\\)");
			this.vme_floater.hide();
		}.bind(this));

		this.vme_floater.add_button("cancel", this.vme_floater.hide);

		this.vme_floater.hide();
	}.bind(this))();

	//	block
	this.add_exercise = function() {
		var el = build("div", "exercise");
		var el_question_equation = build("div", "question_equation", el);
		var el_answer_equation = build("div", "answer_equation", el);

		var check_answer = function() {
			var a = el_question_equation.getAttribute("data-equation");
			var b = el_answer_equation.getAttribute("data-equation");
			if (a === null || b === null) return;
			if (e_math.equals(a, b)) {
				el.setAttribute("data-correct", "");
				el.removeAttribute("data-incorrect");
			} else {
				el.setAttribute("data-incorrect", "");
				el.removeAttribute("data-correct");
			}
		}.bind(this);


		el_question_equation.addEventListener("click", function() {
			var eq = el_question_equation.getAttribute("data-equation") || "";
			this.show_vme(eq, function(eq){
				el_question_equation.innerText = eq; 
				el_question_equation.setAttribute("data-equation", eq);
				MathJax.Hub.Typeset(); 
				check_answer();
			}.bind(this));
		}.bind(this));

		
		el_answer_equation.addEventListener("click", function() {
			var eq = el_answer_equation.getAttribute("data-equation") || "";
			this.show_vme(eq, function(eq){
				el_answer_equation.innerText = eq; 
				el_answer_equation.setAttribute("data-equation", eq);
				MathJax.Hub.Typeset(); 
				check_answer();
			}.bind(this));
		}.bind(this));

		this.el_exercises.appendChild(el);
		return el;

	}.bind(this);



	this.build_viewer = function() {


		var el_add = build("button", undefined, this.el, "Add");
		el_add.addEventListener("click", this.add_exercise);
		this.add_exercise();
	}.bind(this);

	if (this.mode == "editor") {
		//	not implemented
	} else {
		this.build_viewer();
	}


	Object.defineProperty(this, "data", {
		'get' : function() {
			if (this.mode == "editor") {
				//	not implemented
			} else {
				return this._data;
			}
		},
		'set' : function(v) {
			if (this.mode == "editor") {
				//	not implemented
			} else {
				this._data = v;
			}
		}
	});


}


