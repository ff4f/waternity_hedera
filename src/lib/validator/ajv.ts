import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { JSONSchemaType } from 'ajv';

// Singleton AJV instance with strict mode and JSON Schema 2020-12
class AjvSingleton {
  private static instance: Ajv;

  public static getInstance(): Ajv {
    if (!AjvSingleton.instance) {
      AjvSingleton.instance = new Ajv({
        strict: true,
        strictSchema: true,
        strictNumbers: true,
        strictTypes: true,
        strictTuples: true,
        strictRequired: true,
        allErrors: true,
        removeAdditional: false,
        useDefaults: false,
        coerceTypes: false
      });

      // Add format validation (uuid, date-time, etc.)
      addFormats(AjvSingleton.instance);
    }

    return AjvSingleton.instance;
  }
}

export const ajv = AjvSingleton.getInstance();
export type { JSONSchemaType };
export default ajv;

// Validate data against a specific schema
export function validateSchema(schemaId: string, data: any) {
  const validate = ajv.getSchema(schemaId);
  if (!validate) {
    throw new Error(`Schema not found: ${schemaId}`);
  }
  
  const valid = validate(data);
  return {
    valid,
    errors: validate.errors || []
  };
}