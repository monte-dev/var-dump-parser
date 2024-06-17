function handleClick() {
	const input = editor.getValue();
	const el = document.createElement('textarea');
	el.innerHTML = input;
	const inputString = el.value;

	const resultObject = convertStringToObject(inputString);
	const resultObjectFormatted = removeDataType(resultObject);
	const outputValue = convertToPhpArray(resultObjectFormatted);
	document.getElementById('outputTextarea').value += outputValue;
	document.getElementById('outputTextarea').disabled =
		outputValue.length === 0 ? true : false;
}

function convertStringToObject(inputString) {
	inputString = inputString.trim();

	const resultObject = {};

	const keyValuePairs = [];
	let startIndex = inputString.indexOf('["');

	while (startIndex !== -1) {
		const keyStartIndex = startIndex + 2;
		const keyEndIndex = inputString.indexOf('"]=>', keyStartIndex);

		if (keyEndIndex === -1) {
			throw new Error('Invalid input format, missing "]=>".');
		}

		const key = inputString.slice(keyStartIndex, keyEndIndex);
		let valueStartIndex = keyEndIndex + 4;
		let valueEndIndex = inputString.indexOf('["', valueStartIndex);
		if (valueEndIndex === -1) {
			valueEndIndex = inputString.length;
		}

		let value = inputString.slice(valueStartIndex, valueEndIndex).trim();
		if (value.startsWith('array(')) {
			let arrayEndIndex = inputString.lastIndexOf('}');
			if (arrayEndIndex !== -1) {
				let secondToLastIndex = inputString.lastIndexOf(
					'}',
					arrayEndIndex - 1
				);
				if (secondToLastIndex !== -1) {
					arrayEndIndex = secondToLastIndex;
				}
				value = inputString
					.slice(valueStartIndex, arrayEndIndex + 1)
					.trim();
				valueEndIndex = arrayEndIndex + 1;
			} else {
				throw new Error('Invalid input format, unclosed array.');
			}
		}
		keyValuePairs.push([key, value]);
		startIndex = inputString.indexOf('["', valueEndIndex);
	}

	keyValuePairs.forEach(([key, value]) => {
		try {
			if (typeof value !== 'string') {
				throw new Error(
					`--- Value for key "${key}" is not a string. ---`
				);
			}

			if (value.startsWith('array(')) {
				value = value.replace(/^array\(\d+\) \{/, '');
				const nestedObject = convertStringToObject(value);
				resultObject[key] = nestedObject;
			} else if (value.includes('string(')) {
				const stringValue = value.substring(
					value.indexOf('"') + 1,
					value.lastIndexOf('"')
				);
				resultObject[key] = stringValue;
			} else {
				resultObject[key] = value;
			}
		} catch (error) {
			console.error(
				`--- Error @ "${key}" with value "${value}" ---`,
				error
			);
		}
	});
	return resultObject;
}

function removeDataType(objectToRemoveDataTypes) {
	const modifiedObject = {};

	for (const [key, value] of Object.entries(objectToRemoveDataTypes)) {
		let modifiedValue;

		switch (true) {
			case typeof value === 'string' && value.startsWith('string('):
				modifiedValue = value.substring(value.indexOf('"') + 1);
				const endIndex = modifiedValue.lastIndexOf('"');
				if (endIndex !== -1) {
					modifiedValue = modifiedValue.substring(0, endIndex);
				}
				modifiedValue = modifiedValue.trim();
				break;
			case typeof value === 'string' && value.startsWith('float('):
				const floatNumericValue = value.substring(
					value.indexOf('(') + 1,
					value.indexOf(')')
				);
				modifiedValue = parseFloat(floatNumericValue);
				break;
			case typeof value === 'string' && value.startsWith('int('):
				const intNumericValue = value.substring(
					value.indexOf('(') + 1,
					value.indexOf(')')
				);
				modifiedValue = parseInt(intNumericValue);
				break;
			case typeof value === 'string' && value.startsWith('bool('):
				modifiedValue = value.includes('true');
				break;
			case typeof value === 'string' && value.startsWith('array('):
				let nestedArrayValue = convertStringToObject(value);
				modifiedValue = removeDataType(nestedArrayValue);
				break;
			case typeof value === 'string' && value.startsWith('NULL'):
				modifiedValue = null;
				break;
			case typeof value === 'object' && !Array.isArray(value):
				modifiedValue = removeDataType(value);
				break;
			default:
				modifiedValue = value;
				break;
		}

		modifiedObject[key] = modifiedValue;
	}

	return modifiedObject;
}

var currentDepth = 0;

function convertToPhpArray(obj, currentDepth = 0) {
	let phpArray = '[\n';

	currentDepth++;

	for (const key in obj) {
		if (obj.hasOwnProperty(key)) {
            phpArray += ' '.repeat(currentDepth * 4);

			phpArray += `"${key}" => `;
			switch (typeof obj[key]) {
				case 'string':
					phpArray += `"${obj[key]}"`;
					break;
				case 'boolean':
					phpArray += obj[key] ? 'true' : 'false';
					break;
				case 'number':
					phpArray += `${obj[key]}`;
					break;
				case 'object':
					if (obj[key] !== null && !Array.isArray(obj[key])) {
						phpArray += `${convertToPhpArray(
							obj[key],
							currentDepth
						)}`;
					} else if (Array.isArray(obj[key])) {
						phpArray += `${convertToPhpArray(
							obj[key],
							currentDepth
						)}`;
					} else {
						phpArray += 'NULL';
					}
					break;
				default:
					phpArray += 'NULL';
			}

			phpArray += ',\n';
		}
	}

	currentDepth--;
    phpArray += ' '.repeat(currentDepth * 4);
	phpArray += ']';

	if (currentDepth === 0) {
		phpArray += ';';
	}
	return phpArray;
}

function handleCopy() {
	const outputValue = document.getElementById('outputTextarea').value;

	if (outputValue.length > 0) {
		navigator.clipboard
			.writeText(outputValue)
			.then(() => {
				alert('Copied to clipboard');
			})
			.catch((err) => {
				console.error('Error copying to clipboard: ', err);
				alert('Error copying to clipboard');
			});
	} else {
		alert('No data to copy');
	}
}

function handleClear() {
	document.getElementById('outputTextarea').value = '';
	document.getElementById('outputTextarea').disabled = true;
}