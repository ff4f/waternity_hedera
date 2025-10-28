import Ajv from 'ajv/dist/2020';
import addFormats from 'ajv-formats';
import commonHcsSchema from './schemas/common.hcs.schema.json';

// Create AJV 2020-12 singleton instance
const ajv = new Ajv({
  strict: false,
  allErrors: true,
  verbose: true,
  discriminator: true,
  validateFormats: true,
  validateSchema: false,
});

// Add format validators
addFormats(ajv);

// Add common schema for referencing
ajv.addSchema(commonHcsSchema, 'https://waternity.com/schemas/common.hcs.schema.json');
ajv.addSchema(commonHcsSchema, './common.hcs.schema.json');

// Export singleton instance
export default ajv;

// Export types for convenience
export type { ValidateFunction, ErrorObject } from 'ajv';