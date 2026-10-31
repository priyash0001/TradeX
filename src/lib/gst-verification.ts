// Indian GSTIN Validator and State Code Reference for TradeX B2B

export const GST_STATE_CODES: Record<string, string> = {
  '01': 'Jammu and Kashmir',
  '02': 'Himachal Pradesh',
  '03': 'Punjab',
  '04': 'Chandigarh',
  '05': 'Uttarakhand',
  '06': 'Haryana',
  '07': 'Delhi',
  '08': 'Rajasthan',
  '09': 'Uttar Pradesh',
  '10': 'Bihar',
  '11': 'Sikkim',
  '12': 'Arunachal Pradesh',
  '13': 'Nagaland',
  '14': 'Manipur',
  '15': 'Mizoram',
  '16': 'Tripura',
  '17': 'Meghalaya',
  '18': 'Assam',
  '19': 'West Bengal',
  '20': 'Jharkhand',
  '21': 'Odisha',
  '22': 'Chhattisgarh',
  '23': 'Madhya Pradesh',
  '24': 'Gujarat',
  '27': 'Maharashtra',
  '29': 'Karnataka',
  '30': 'Goa',
  '32': 'Kerala',
  '33': 'Tamil Nadu',
  '36': 'Telangana',
  '37': 'Andhra Pradesh',
};

export interface GstValidationResult {
  isValid: boolean;
  stateCode?: string;
  stateName?: string;
  panNumber?: string;
  entityCode?: string;
  errorMessage?: string;
}

export function validateGstNumber(gstNumber: string): GstValidationResult {
  if (!gstNumber) {
    return { isValid: false, errorMessage: 'GST number is required' };
  }

  const cleanGst = gstNumber.trim().toUpperCase();

  // Standard Indian GSTIN Regex: 2-digit state code + 10-char PAN + 1 entity num + 'Z' + 1 check digit
  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

  if (!gstRegex.test(cleanGst)) {
    return {
      isValid: false,
      errorMessage: 'Invalid 15-digit GSTIN format. Example: 27AABCT3518Q1Z6',
    };
  }

  const stateCode = cleanGst.substring(0, 2);
  const stateName = GST_STATE_CODES[stateCode] || 'Unknown State';
  const panNumber = cleanGst.substring(2, 12);
  const entityCode = cleanGst.substring(12, 13);

  return {
    isValid: true,
    stateCode,
    stateName,
    panNumber,
    entityCode,
  };
}
