# Print opcodes
This tool takes bytecode and shows the corresponding opcodes in a human readable representation

## Usage
- `node main.js -i <path-input> -o <path-output>`
  - `-i <path-input>`: specify the file path where the bytecode is
    - bytecode should be in hexadecimal representation
    - 
    - mandatory input
  - `-o <path-output>`: specify the output file where the opcodes will be writen
     - default value: `output.json`

## Example
- you can view an exampple of bytecode in `input-example.data`
- command example
  - `node main.js -i input-example.data`
  - inspect `output.json` to check the result