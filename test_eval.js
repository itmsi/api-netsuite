const fs = require('fs');

const payload = {
    "status": "success",
    "page": 1,
    "page_size": 50,
    "total_records": 4,
    "total_pages": 1,
    "data": [
        {
            "id": "6700",
            "lines": [
                {
                    "custitem_me_product_category": "1",
                    "custitem_me_product_category_display": "UNIT"
                }
            ]
        }
    ]
};

const records = payload.data;
const record = records[0];
const line = record.lines[0];

const res1 = line.custitem_me_product_category_display == 'UNIT' ? '870900' : '980200';
const res2 = String(line.custitem_me_product_category_display || '').trim().toUpperCase() === 'UNIT' ? '870900' : '980200';

console.log("res1: " + res1);
console.log("res2: " + res2);
