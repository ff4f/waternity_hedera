import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import hcsCommonSchema from '../schemas/hcs.common.schema.json';
import hcsMeterReadingSchema from '../schemas/hcs.meter_reading.schema.json';
import hcsValveCommandSchema from '../schemas/hcs.valve_command.schema.json';
import hcsDocAnchoredSchema from '../schemas/hcs.doc_anchored.schema.json';
import hcsSettlementRequestedSchema from '../schemas/hcs.settlement_requested.schema.json';
import hcsSettlementApprovedSchema from '../schemas/hcs.settlement_approved.schema.json';
import hcsSettlementExecutedSchema from '../schemas/hcs.settlement_executed.schema.json';
import hcsTokenMintedSchema from '../schemas/hcs.token_minted.schema.json';
import hcsPayoutDistributedSchema from '../schemas/hcs.payout_distributed.schema.json';
// New route schemas
import investSchema from '../schemas/invest.schema.json';
import settlementRequestSchema from '../schemas/settlement_request.schema.json';
import settlementApproveSchema from '../schemas/settlement_approve.schema.json';
import settlementExecuteSchema from '../schemas/settlement_execute.schema.json';
import anchorDocSchema from '../schemas/anchor_doc.schema.json';
import hcsEventSchema from '../schemas/hcs_event.schema.json';
import htsCreateSchema from '../schemas/hts_create.schema.json';
import htsMintSchema from '../schemas/hts_mint.schema.json';
import settlementCreateSchema from '../schemas/settlement_create.schema.json';
// import waterQualityCreateSchema from '../schemas/water_quality_create.schema.json';

// Create AJV instance with strict mode
const ajv = new Ajv({
  strict: false,
  allErrors: true,
  verbose: true
});

// Add format validators
addFormats(ajv);

// Register HCS schemas
ajv.addSchema(hcsCommonSchema, 'hcs.common.schema.json');
ajv.addSchema(hcsMeterReadingSchema, 'hcs.meter_reading.schema.json');
ajv.addSchema(hcsValveCommandSchema, 'hcs.valve_command.schema.json');
ajv.addSchema(hcsDocAnchoredSchema, 'hcs.doc_anchored.schema.json');
ajv.addSchema(hcsSettlementRequestedSchema, 'hcs.settlement_requested.schema.json');
ajv.addSchema(hcsSettlementApprovedSchema, 'hcs.settlement_approved.schema.json');
ajv.addSchema(hcsSettlementExecutedSchema, 'hcs.settlement_executed.schema.json');
ajv.addSchema(hcsTokenMintedSchema, 'hcs.token_minted.schema.json');
ajv.addSchema(hcsPayoutDistributedSchema, 'hcs.payout_distributed.schema.json');

// Register route schemas
ajv.addSchema(investSchema, 'invest.schema.json');
ajv.addSchema(settlementRequestSchema, 'settlement_request.schema.json');
ajv.addSchema(settlementApproveSchema, 'settlement_approve.schema.json');
ajv.addSchema(settlementExecuteSchema, 'settlement_execute.schema.json');
ajv.addSchema(anchorDocSchema, 'anchor_doc.schema.json');
ajv.addSchema(hcsEventSchema, 'hcs_event.schema.json');
ajv.addSchema(htsCreateSchema, 'hts_create.schema.json');
ajv.addSchema(htsMintSchema, 'hts_mint.schema.json');
ajv.addSchema(settlementCreateSchema, 'settlement_create.schema.json');
// ajv.addSchema(waterQualityCreateSchema, 'water_quality_create.schema.json');

// Add water quality schema manually
const waterQualityCreateSchema = {
  "type": "object",
  "properties": {
    "wellId": {
      "type": "string",
      "minLength": 1,
      "description": "ID of the well being tested"
    },
    "ph": {
      "type": "number",
      "minimum": 0,
      "maximum": 14,
      "description": "pH level of the water (0-14)"
    },
    "turbidity": {
      "type": "number",
      "minimum": 0,
      "description": "Turbidity level in NTU (Nephelometric Turbidity Units)"
    },
    "tds": {
      "type": "number",
      "minimum": 0,
      "description": "Total Dissolved Solids in ppm (parts per million)"
    },
    "temperature": {
      "type": "number",
      "description": "Water temperature in Celsius"
    },
    "chlorine": {
      "type": "number",
      "minimum": 0,
      "description": "Chlorine level in ppm"
    },
    "bacteria": {
      "type": "number",
      "minimum": 0,
      "description": "Bacteria count (CFU/100ml)"
    },
    "compliance": {
      "type": "boolean",
      "description": "Whether the water meets quality standards"
    },
    "testedBy": {
      "type": "string",
      "minLength": 1,
      "description": "Name or ID of the person/organization who conducted the test"
    },
    "certificationBody": {
      "type": "string",
      "description": "Optional certification body that validated the test"
    }
  },
  "required": [
    "wellId",
    "ph",
    "turbidity",
    "tds",
    "temperature",
    "chlorine",
    "bacteria",
    "compliance",
    "testedBy"
  ],
  "additionalProperties": false
};
ajv.addSchema(waterQualityCreateSchema, 'water_quality_create.schema.json');

// Export the AJV instance for use in other modules
export { ajv };

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

// Legacy function for HCS event validation
export function validateEvent(event: any) {
  const validate = ajv.getSchema('hcs.common.schema.json');
  if (validate && validate(event)) {
    const payloadSchema = ajv.getSchema(`hcs.${event.type.toLowerCase()}.schema.json`);
    if (payloadSchema && payloadSchema(event.payload)) {
      return { valid: true };
    }
    return { valid: false, errors: payloadSchema?.errors };
  }
  return { valid: false, errors: validate?.errors };
}