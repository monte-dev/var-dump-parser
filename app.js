function handleClick() {
	const input = document.getElementById('inputTextarea').value;
	const el = document.createElement('textarea');
	el.innerHTML = input;
	const inputString = el.value;

	try {
		const resultObject = convertStringToObject(inputString);
		const resultObjectFormatted = removeDataType(resultObject);
		const outputValue = convertToPhpArray(resultObjectFormatted);
		document.getElementById('outputTextarea').value += outputValue;
		document.getElementById('outputTextarea').disabled =
			outputValue.length === 0 ? true : false;
	} catch (error) {
		console.log(error.message);
	}
}

function convertStringToObject(inputString) {
	inputString = inputString.trim();

	if (!(inputString.endsWith('}') || inputString.endsWith('>'))) {
		throw new Error('Invalid input format, missing closing } or >');
	}

	const keyValuePairs = [];
	let startIndex = inputString.indexOf('["');

	while (startIndex !== -1) {
		const keyStartIndex = startIndex + 2;
		const keyEndIndex = inputString.indexOf('"]=>', keyStartIndex);

		const key = inputString.slice(keyStartIndex, keyEndIndex);
		let valueStartIndex = keyEndIndex + 4;
		let valueEndIndex = inputString.indexOf('["', valueStartIndex);
		if (valueEndIndex === -1) {
			valueEndIndex = inputString.length;
		}

		let value = inputString.slice(valueStartIndex, valueEndIndex).trim();

		if (value.includes('array(')) {
			let arrayEndIndex = inputString.indexOf('}', valueStartIndex);
			if (arrayEndIndex !== -1) {
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

	const resultObject = {};

	keyValuePairs.forEach(([key, value]) => {
		resultObject[key] = value;
	});

	return resultObject;
}

function removeDataType(objectToRemoveDataTypes) {
	const modifiedObject = {};

	for (const [key, value] of Object.entries(objectToRemoveDataTypes)) {
		let valueType;

		if (value.startsWith('string(')) valueType = 'string';
		else if (value.startsWith('float(')) valueType = 'float';
		else if (value.startsWith('int(')) valueType = 'int';
		else if (value.startsWith('bool(')) valueType = 'bool';
		else if (value.startsWith('array(')) valueType = 'array';
		else if (value === 'NULL') valueType = 'NULL';

		let modifiedValue;

		switch (valueType) {
			case 'string':
				if (value.startsWith('string(')) {
					modifiedValue = value.substring(value.indexOf('"') + 1);
					const endIndex = modifiedValue.lastIndexOf('"');
					if (endIndex !== -1) {
						modifiedValue = modifiedValue.substring(0, endIndex);
					}
				} else {
					modifiedValue = value;
				}
				modifiedValue = modifiedValue.trim();
				break;
			case 'float':
			case 'int':
				const numericValue = value.substring(
					value.indexOf('(') + 1,
					value.indexOf(')')
				);
				modifiedValue =
					valueType === 'float'
						? parseFloat(numericValue)
						: parseInt(numericValue);
				break;
			case 'bool':
				modifiedValue = value.includes('true');
				break;
			case 'NULL':
				modifiedValue = null;
				break;
			case 'array':
				let nestedValue = convertStringToObject(value);
				modifiedValue = removeDataType(nestedValue);
				break;
			default:
				modifiedValue = value;
				break;
		}

		modifiedObject[key] = modifiedValue;
	}
	return modifiedObject;
}

function convertToPhpArray(obj) {
	console.log(obj);
	let phpArray = '[\n';

	for (const key in obj) {
		if (obj.hasOwnProperty(key)) {
			phpArray += `\t"${key}" => `;
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
					if (Array.isArray(obj[key])) {
						phpArray += `${convertToPhpArray(obj[key])}`;
					} else {
						phpArray += `${convertToPhpArray(obj[key])}`;
					}
					break;
				default:
					phpArray += 'NULL';
			}

			phpArray += ',\n';
		}
	}
	if (!phpArray.endsWith('];')) {
		phpArray += '];';
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
