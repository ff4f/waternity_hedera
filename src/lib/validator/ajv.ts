import Ajv from 'ajv';
import hcsCommonSchema from '../schemas/hcs.common.schema.json';
import hcsMeterReadingSchema from '../schemas/hcs.meter_reading.schema.json';
import hcsValveCommandSchema from '../schemas/hcs.valve_command.schema.json';
import hcsDocAnchoredSchema from '../schemas/hcs.doc_anchored.schema.json';
import hcsSettlementRequestedSchema from '../schemas/hcs.settlement_requested.schema.json';
import hcsSettlementApprovedSchema from '../schemas/hcs.settlement_approved.schema.json';
import hcsSettlementExecutedSchema from '../schemas/hcs.settlement_executed.schema.json';
import hcsTokenMintedSchema from '../schemas/hcs.token_minted.schema.json';
import hcsPayoutDistributedSchema from '../schemas/hcs.payout_distributed.schema.json';

const ajv = new Ajv();

ajv.addSchema(hcsCommonSchema, 'hcs.common.schema.json');
ajv.addSchema(hcsMeterReadingSchema, 'hcs.meter_reading.schema.json');
ajv.addSchema(hcsValveCommandSchema, 'hcs.valve_command.schema.json');
ajv.addSchema(hcsDocAnchoredSchema, 'hcs.doc_anchored.schema.json');
ajv.addSchema(hcsSettlementRequestedSchema, 'hcs.settlement_requested.schema.json');
ajv.addSchema(hcsSettlementApprovedSchema, 'hcs.settlement_approved.schema.json');
ajv.addSchema(hcsSettlementExecutedSchema, 'hcs.settlement_executed.schema.json');
ajv.addSchema(hcsTokenMintedSchema, 'hcs.token_minted.schema.json');
ajv.addSchema(hcsPayoutDistributedSchema, 'hcs.payout_distributed.schema.json');

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