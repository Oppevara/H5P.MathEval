(function(){

	var e_math_proto = function() {
		this.parser = new window.port_eval.Parser();

		this.translate_latex = function(str) {
			str = str.substring(2, str.length - 2);
			for (var i = str.length; i >= 0; i--) {
				var segment = str.substring(i);
				segment = segment.replace(/\\frac{([^}]+)}{([^}]+)}/g, "($1)/($2)");
	            segment = segment.replace(/\^{([^}]+)}/g, "^($1)");
	            segment = segment.replace(/\\sqrt{([^}]+)}/g, "sqrt($1)");
	            segment = segment.replace(/\\sqr{([^}]+)}/g, "sqr($1)");
	            segment = segment.replace(/\\text{([^}]+)}/g, "$1");
	            segment = segment.replace(/\\left\(/g, "(");
	            segment = segment.replace(/\\right\)/g, ")");
	            segment = segment.replace(/\\left\\{/g, "{");
	            segment = segment.replace(/\\right\\}/g, "}");
	            segment = segment.replace(/\\left\[/g, "[");
	            segment = segment.replace(/\\right\]/g, "]");
	            segment = segment.replace(/\\left\|([^\\right\|]+)\\right\|/g, "abs($1)");
	            segment = segment.replace(/\\sin/g, "sin");
	            segment = segment.replace(/\\cos/g, "cos");
	            segment = segment.replace(/\\tan/g, "tan");
	            segment = segment.replace(/\\cdot/g, "*");
	            segment = segment.replace(/\\pi/g, "PI");
	            segment = segment.replace(/\\%/g, "%");
	            segment = segment.replace(/\\abspipe([^\\abspipe]+)\\abspipe/g, "abs($1)");
	            segment = segment.replace(/lnabs\(([^)]+)\)/, "ln(abs($1))");
	            segment = segment.replace(/\\ /g, " ");
	            segment = segment.replace(/\\backslash/g, "\\");
	            segment = segment.replace(/\\ ([^\\]+)/g, " $1");
	            segment = segment.replace(/\\+$/, "");
	            segment = segment.replace("\\div", "/");
	            segment = segment.replace("\\times", "*");
	            segment = segment.replace("\\lt", "<");
	            segment = segment.replace("\\gt", ">");
	            segment = segment.replace("\\leq", "<=");
	            segment = segment.replace("\\geq", ">=");
	           	segment = segment.replace("\\neq", "!=");

	            segment = segment.replace(/([^=])[=]([^=])/, "$1==$2");
	            segment = segment.toLowerCase();
	            str = str.substring(0, i) + segment;
			}
			return str;
		}.bind(this);

		this.process_str = function(str) {
			//	find latex segments
			var pos = 0;
			var reconstruct = [];

			while (true) {
				var ltx_start = str.indexOf("\\(", pos);
				if (ltx_start === -1) break;
				var ltx_end = str.indexOf("\\)", ltx_start);
				if (ltx_end === -1) break;
				ltx_end += 2;
				reconstruct.push(str.substring(pos, ltx_start));
				reconstruct.push(this.translate_latex(str.substring(ltx_start, ltx_end)));
				pos = ltx_end;
			}
			reconstruct.push(str.substring(pos));
			return reconstruct.join("");
		}.bind(this);

		this.parse = function(str) {
			str = this.process_str(str);
			return this.parser.parse(str);
		}.bind(this);

		this.generate_variable_sets = function(base_set, generated_names, generated_values) {
			var sets = [];

			for (var i = 0; i < generated_values.length; i++) {
				var set = Object.assign({}, base_set);
				set[generated_names[0]] = generated_values[i];

				if (generated_names.length === 1) {
					sets.push(set);
				} else {
					sets = sets.concat(this.generate_variable_sets(set, generated_names.slice(1), generated_values));
				}
			}
			
			return sets;
		}.bind(this);

		this.eval = function(equation_str, variables) {
			var equation = this.parse(equation_str);
			return equation.evaluate(variables);
		}.bind(this);

		this.equals = function(a, b, variables) {
			//	input
			variables = variables || {};
			variables.pi = Math.PI;

			//	equations
			var equation_a = this.parse(a).simplify(variables);
			var equation_b = this.parse(b).simplify(variables);

			//	missing variables
			var missing_variables = equation_a.variables();
			var missing_variables_2 = equation_b.variables();
			for (var i = 0; i < missing_variables_2.length; i++) {
				if (missing_variables.indexOf(missing_variables_2[i]) === -1) missing_variables.push(missing_variables_2[i]);
			}

			//	test
			if (missing_variables.length > 0) {
				var test_values = [0, 1, -1, 2, -2, 0.123, -0.123, 15485863, -15485863, 393342743, -393342743, Math.PI, -Math.PI];
				var variable_sets = this.generate_variable_sets(variables, missing_variables, test_values);

				for (var i = 0; i < variable_sets.length; i++) {		
					var result_a = equation_a.evaluate(variable_sets[i]);
					var result_b = equation_b.evaluate(variable_sets[i]);
					var error_size = Math.abs((result_a - result_b) / result_a);
					if (error_size > 0.0000001) return false;
				}
				return true;
			} else {
				var result_a = equation_a.evaluate();
				var result_b = equation_b.evaluate();
				var error_size = Math.abs((result_a - result_b) / result_a);
				if (error_size > 0.0000001) return false;
				return true;
			}
		}


	};

	window.e_math = new e_math_proto();
})();



