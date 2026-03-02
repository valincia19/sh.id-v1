import pool from './src/db/postgres.js';
import * as adminService from './src/modules/admin/admin.service.js';

const id = '61e63f0b-cbd4-4f03-a806-b429b6d8cbd4';
try {
    const res = await adminService.deleteExecutor(id);
    console.log('Success:', res);
} catch (err) {
    console.error('Error:', err);
} finally {
    process.exit();
}
