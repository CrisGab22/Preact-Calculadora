import { Signal } from "@preact/signals";
import Decimal from "decimal.js";

enum REGEX {
    digit = "^[0-9]$",
    validInput = "^[0-9.]$",
    /**
     * @see OPERATORS
     */
    validOperation = "(\\d+(\\.\\d+)?|[+\\-×÷])",
    validNumber = "^\\d+(\\.\\d+)?$"
}  

enum OPERATORS {    
    ADDITION = '+',
    SUBTRACTION = '-',
    MULTIPLICATION = '×',
    DIVISION = '÷',
}

enum KEYBOARD_KEYS {
    BACKSPACE = 'Backspace',
    ESCAPE = 'Escape',
    ENTER = 'Enter',
}

export default class CalculatorService {
    constructor(private _displayValue: Signal<string>) {}

    get displayValue(): string {
        return this._displayValue.value;
    }
    set displayValue(value: string) {
        this._displayValue.value = value;
    }

    public handleOnChange = (_value: string) => {
        if (this.isDigit(_value)) {
            this.handleDigit(_value);
        } else if (this.isValidOperator(_value)) {
            this.handleOperator(_value);
        } else if (_value === '=') {
            this.calculateExpression();
        }
    };

    private handleDigit(digit: string) {
        if (this.displayValue === '0' && digit === '0') return;

        if (this.displayValue === '' && digit === '.'){
            this.displayValue = '0.';
            return;
        }

        if (this.displayValue === '0' && RegExp(REGEX.digit).test(digit))
            return (this.displayValue = digit);

        this.displayValue = `${this.displayValue}${digit}`;
    }

	/**
	 * Prevent consecutive operators
	 */
    private handleOperator(operator: string) {
        if (this.displayValue === '') return; 

        if(operator === '/') operator = operator = OPERATORS.DIVISION;
        if(['x','*'].includes(operator)) operator = OPERATORS.MULTIPLICATION;

        const lastChar = this.displayValue.slice(-1);
        if (this.isValidOperator(lastChar)) {
            this.displayValue = `${this.displayValue.substring(0, this.displayValue.length - 1)}${operator}`;
            return;
        }

        this.displayValue = `${this.displayValue}${operator}`;
    }

    private calculateExpression() {
        try {
            const result = this.calculate(this.displayValue);
            this.displayValue = result.toString();
        } catch (error) {
            this.displayValue = "Error";
        }
    }

    private calculate(expression: string): Decimal {
        const tokens = expression.match(REGEX.validOperation);
        if (!tokens) {
            throw new Error("Invalid expression");
        }
    
        const numbers: Decimal[] = [];
        const operators: string[] = [];
    
        // 2. Separar números y operadores
        for (const token of tokens) {
            if (RegExp(REGEX.validNumber).test(token)) {
                numbers.push(new Decimal(token));
            } else if (this.getOperations().includes(token)) {
                operators.push(token);
            } else {
                throw new Error(`Invalid token: ${token}`);
            }
        }
    
        // 3. Resolver operaciones respetando la prioridad
        while (operators.length > 0) {
            // Buscar primero multiplicaciones y divisiones
            const priorityIndex = operators.findIndex(op => 
                [OPERATORS.MULTIPLICATION, OPERATORS.DIVISION].includes(op as OPERATORS)
            );
    
            const opIndex = priorityIndex !== -1 ? priorityIndex : 0;
            const operator = operators.splice(opIndex, 1)[0];
            const left = numbers.splice(opIndex, 1)[0];
            const right = numbers.splice(opIndex, 1)[0];
    
            if (!left || !right) {
                throw new Error("Malformed expression");
            }
    
            let result: Decimal;
    
            switch (operator) {
                case OPERATORS.ADDITION:
                    result = left.plus(right);
                    break;
                case OPERATORS.SUBTRACTION:
                    result = left.minus(right);
                    break;
                case OPERATORS.MULTIPLICATION:
                    result = left.times(right);
                    break;
                case OPERATORS.DIVISION:
                    if (right.isZero()) {
                        throw new Error("Division by zero");
                    }
                    result = left.div(right);
                    break;
                default:
                    throw new Error(`Unknown operator: ${operator}`);
            }
    
            // Insertar el resultado en la posición correcta
            numbers.splice(opIndex, 0, result);
        }
    
        // 4. El resultado final es el único número restante
        return numbers[0];
    }
    

    private isDigit(value: string) {
        return RegExp(REGEX.validInput).exec(value);
    }

    private isValidOperator(value: string) {
        return this.getOperations().includes(value);
    }

    
	public handleKeyDown = (event: KeyboardEvent) => {
		event.preventDefault();
		if (event.key === KEYBOARD_KEYS.ENTER) {
			this.calculateExpression();
		} else if (event.key === KEYBOARD_KEYS.BACKSPACE) {
			this.displayValue = this.displayValue.slice(0, -1);
		} else if (event.key === KEYBOARD_KEYS.ESCAPE) {
			this.displayValue = '0';
		} else if (this.isDigit(event.key)) {
			this.handleDigit(event.key);
		} else if (this.isValidOperator(event.key)) {
			this.handleOperator(event.key);
	    }
	}

    private getOperations() {
        return [
            OPERATORS.ADDITION,
            OPERATORS.SUBTRACTION,
            OPERATORS.MULTIPLICATION,
            OPERATORS.DIVISION
        ] as string[];
    }
}