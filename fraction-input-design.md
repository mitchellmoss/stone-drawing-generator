# Fraction Input Support Design

## Requirements
- Allow users to enter dimensions using fractions instead of decimals
- Support common fraction formats:
  - Simple fractions (e.g., "1/2", "3/4")
  - Mixed numbers (e.g., "2-1/2", "3-3/4")
  - Whole numbers (e.g., "2", "3")
- Convert fraction inputs to decimal values for internal processing
- Display dimensions as fractions in the mockup

## Implementation Approach

### 1. Fraction Parsing Utility
Create a utility module with functions to:
- Parse fraction strings to decimal values
- Convert decimal values to fraction strings
- Support common fraction formats
- Handle validation and error cases

### 2. UI Updates
- Replace number inputs with text inputs that accept fraction formats
- Add validation and formatting for fraction inputs
- Provide visual feedback for valid/invalid inputs
- Show examples or hints for acceptable fraction formats

### 3. Display Updates
- Modify the dimension display in mockups to show fractions instead of decimals
- Implement a function to convert decimal values to the closest fraction representation
- Use proper fraction formatting in the UI and exports

## Fraction Parsing Logic

### String to Decimal Conversion
1. Validate input format
2. Handle different input formats:
   - Simple fractions: Split by "/" and divide numerator by denominator
   - Mixed numbers: Split by "-" and add whole number to fraction part
   - Whole numbers: Parse directly
3. Return decimal value for internal use

### Decimal to Fraction Conversion
1. Separate whole number and decimal parts
2. Convert decimal part to fraction using GCD algorithm
3. Simplify fraction to lowest terms
4. Format as mixed number if whole part is non-zero

## User Experience Considerations
- Provide clear examples of acceptable formats
- Auto-format inputs to standardize display
- Validate inputs in real-time
- Provide helpful error messages for invalid inputs
- Maintain backward compatibility with decimal inputs
