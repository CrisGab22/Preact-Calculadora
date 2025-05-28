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
    MULTIPLICATION_1 = '×',
    MULTIPLICATION_2 = '*',
    DIVISION = '÷',
    DIVISION_1 = '/',

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

        if (this.displayValue === '0' && RegExp(REGEX.digit).test(digit)) {
            this.displayValue = digit;
            return;
        }

        this.displayValue += digit;
    }

    /**
     * Prevent consecutive operators
     */
    private handleOperator(operator: string) {
        if (this.displayValue === '') return;

        if (operator === '/') {
            operator = OPERATORS.DIVISION;
        } else if (['x', '*'].includes(operator)) {
            operator = OPERATORS.MULTIPLICATION;
        }

        const lastChar = this.displayValue.slice(-1);
        if (this.isValidOperator(lastChar)) {
            this.displayValue = this.displayValue.slice(0, -1) + operator;
        } else {
            this.displayValue += operator;
        }
    }

    private calculateExpression() {
        try {
            const result = this.calculate(this.displayValue);
            this.displayValue = result.toString();
        } catch {
            this.displayValue = "Error";
        }
    }

    private calculate(expression: string): Decimal {
        const tokens = expression.match(new RegExp(REGEX.validOperation, 'g'));
        if (!tokens) {
            throw new Error("Invalid expression");
        }

        const numbers: Decimal[] = [];
        const operators: string[] = [];

        for (const token of tokens) {
            if (RegExp(REGEX.validNumber).test(token)) {
                numbers.push(new Decimal(token));
            } else if (this.getOperations().includes(token)) {
                operators.push(token);
            } else {
                throw new Error(`Invalid token: ${token}`);
            }
        }

        while (operators.length > 0) {
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
                    if (right.isZero()) throw new Error("Division by zero");
                    result = left.div(right);
                    break;
                default:
                    throw new Error(`Unknown operator: ${operator}`);
            }

            numbers.splice(opIndex, 0, result);
        }

        return numbers[0];
    }

    private isDigit(value: string): boolean {
        return RegExp(REGEX.validInput).test(value);
    }

    private isValidOperator(value: string): boolean {
        return this.getOperations().includes(value);
    }

    public handleKeyDown = (event: KeyboardEvent) => {
        event.preventDefault();

        switch (event.key) {
            case KEYBOARD_KEYS.ENTER:
                this.calculateExpression();
                break;
            case KEYBOARD_KEYS.BACKSPACE:
                this.displayValue = this.displayValue.slice(0, -1);
                break;
            case KEYBOARD_KEYS.ESCAPE:
                this.displayValue = '0';
                break;
            default:
                if (this.isDigit(event.key)) {
                    this.handleDigit(event.key);
                } else if (this.isValidOperator(event.key)) {
                    this.handleOperator(event.key);
                }
        }
    };

    private getOperations(): string[] {
        return Object.values(OPERATORS);
    }
}