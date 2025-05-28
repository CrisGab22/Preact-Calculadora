import { render } from 'preact';
import { signal } from '@preact/signals';
import './style.css';
import CalculatorService from './Calulator';

export function App() {
	
	const display = signal('0');
	const service = new CalculatorService(display);

	const KEYS = [
		'1', '2', '3',
		'4', '5', '6', 
		'7', '8', '9', 
		'0', '.', '='
	];
	
	const OPERATIONS = ['÷', '×', '-', '+'];

	return (
		<div id="calculator">
			<input 
				id="display" 
				type="text" 
				value={display}
				onKeyDown={(e) => service.handleKeyDown(e)}
				onInput={(e) => service.handleOnChange(e.currentTarget.value) }
				inputMode="none"
			/>
			<div class="keypad">
				<div class='keys'>	
					{KEYS.map((key, index) => (
						<button class="key" key={index} onClick={() => service.handleOnChange(key)}>
							{key}
						</button>
					))}
				</div>
				<div class="operations">
					{OPERATIONS.map((operation, index) => (
						<button class="key operation" key={index} onClick={() => service.handleOnChange(operation)}>
							{operation}
						</button>
					))}
				</div>
			</div>
		</div>
	);
}

render(<App />, document.getElementById('app'));
