# CSV Bulk Upload Feature

## Overview
The CSV Bulk Upload feature allows administrators to import multiple student records at once through a CSV file. This streamlines the onboarding process and reduces manual data entry.

## Features

### ✅ Bulk Student Import
- Upload CSV files with student information
- Automatic user account creation
- Profile data population
- Mentor assignment
- Parent information linking

### ✅ Smart Processing
- **Create New Students**: Automatically creates user accounts for new students
- **Update Existing Students**: Updates information for students that already exist
- **Validation**: Validates all data before processing
- **Error Handling**: Provides detailed error messages for failed records

### ✅ Data Validation
- Email format validation
- Phone number validation (10 digits)
- Required field checking
- Duplicate detection

## CSV Format

### Required Columns
| Column Name | Description | Required | Format |
|------------|-------------|----------|---------|
| `rollNo` | Student roll number | ✅ Yes | Text/Number |
| `studentEmail` | Student email address | ✅ Yes | Valid email |
| `studentPhone` | Student phone number | ✅ Yes | 10 digits |

### Optional Columns
| Column Name | Description | Format |
|------------|-------------|---------|
| `fullName` | Student full name | Text |
| `parentsPhone` | Parent phone number | 10 digits |
| `parentsEmail` | Parent email address | Valid email |
| `mentorEmail` | Mentor email (must exist) | Valid email |
| `class` | Class/Grade | Text |
| `section` | Section | Text |

### Sample CSV Format
```csv
rollNo,fullName,studentEmail,studentPhone,parentsPhone,parentsEmail,mentorEmail,class,section
STU001,John Doe,john.doe@example.com,9876543210,9876543211,parent1@example.com,mentor@example.com,10,A
STU002,Jane Smith,jane.smith@example.com,9876543212,9876543213,parent2@example.com,mentor@example.com,10,A
STU003,Mike Johnson,mike.johnson@example.com,9876543214,9876543215,parent3@example.com,mentor@example.com,10,B
```

## How to Use

### Step 1: Download Template
1. Navigate to **Admin Dashboard** → **User Management**
2. Click on **"Bulk Upload CSV"** button
3. Click **"Download CSV Template"** to get the sample format

### Step 2: Prepare Your Data
1. Open the template in Excel, Google Sheets, or any CSV editor
2. Fill in your student data following the format
3. Ensure all required fields are filled
4. Validate email addresses and phone numbers
5. Save as CSV file

### Step 3: Upload CSV
1. Click **"Bulk Upload CSV"** button
2. Drag and drop your CSV file or click to browse
3. Click **"Upload & Process"**
4. Wait for processing to complete

### Step 4: Review Results
The system will show you:
- **Total Records**: Number of rows processed
- **Created**: New students successfully created
- **Updated**: Existing students updated
- **Failed**: Records that failed with error messages

## Default Credentials

### Password Generation
- Default password format: `{rollNo}@123`
- Example: For roll number `STU001`, password will be `STU001@123`
- Students should change their password after first login

## Processing Logic

### For New Students
1. Creates a new User account with role `mentee`
2. Creates a Mentee profile with provided information
3. Links to mentor if mentor email is provided and exists
4. Sets default password as `{rollNo}@123`
5. Activates the account automatically

### For Existing Students
1. Finds existing user by email
2. Updates Mentee profile information
3. Updates phone number, class, section
4. Updates parent information if provided
5. Reassigns mentor if new mentor email is provided

## Error Handling

### Common Errors
| Error | Cause | Solution |
|-------|-------|----------|
| "Roll number is required" | Missing rollNo column | Add rollNo for all students |
| "Valid student email is required" | Invalid or missing email | Check email format |
| "Valid student phone number is required" | Invalid phone format | Use 10-digit numbers only |
| "Mentor not found" | Mentor email doesn't exist | Create mentor first or leave blank |

### Validation Rules
- **Email**: Must be valid format (user@domain.com)
- **Phone**: Must be exactly 10 digits (spaces removed automatically)
- **Roll Number**: Cannot be empty
- **Mentor Email**: Must belong to existing mentor user

## API Endpoints

### Upload CSV
```
POST /api/csv/upload-students
Content-Type: multipart/form-data
Authorization: Bearer {admin_token}

Body: FormData with 'csvFile' field
```

### Download Template
```
GET /api/csv/template
Authorization: Bearer {admin_token}

Response: CSV file download
```

## Response Format

### Success Response
```json
{
  "message": "CSV processing completed",
  "summary": {
    "total": 10,
    "created": 7,
    "updated": 2,
    "failed": 1
  },
  "details": {
    "success": [
      {
        "row": 2,
        "rollNo": "STU001",
        "email": "john.doe@example.com",
        "defaultPassword": "STU001@123",
        "message": "Created successfully"
      }
    ],
    "updated": [
      {
        "row": 3,
        "rollNo": "STU002",
        "email": "jane.smith@example.com",
        "message": "Updated successfully"
      }
    ],
    "failed": [
      {
        "row": 4,
        "data": {...},
        "error": "Valid student email is required"
      }
    ]
  }
}
```

## Security Features

### Access Control
- Only administrators can upload CSV files
- JWT authentication required
- Role-based access control enforced

### File Validation
- Only CSV files accepted
- Maximum file size: 5MB
- File automatically deleted after processing

### Data Security
- Passwords are hashed before storage
- Email addresses converted to lowercase
- Phone numbers sanitized (spaces removed)

## Best Practices

### Data Preparation
1. ✅ Use the provided template
2. ✅ Validate data in spreadsheet before upload
3. ✅ Remove duplicate entries
4. ✅ Ensure mentor emails exist in system
5. ✅ Use consistent formatting

### Error Prevention
1. ✅ Test with small batch first (5-10 records)
2. ✅ Keep backup of original data
3. ✅ Review failed records and fix issues
4. ✅ Re-upload only failed records after fixing

### After Upload
1. ✅ Review the summary report
2. ✅ Check failed records and fix issues
3. ✅ Verify created users in User Management
4. ✅ Inform students of their default passwords
5. ✅ Encourage password changes on first login

## Troubleshooting

### Upload Fails
- Check file format is CSV
- Verify file size is under 5MB
- Ensure you have admin privileges
- Check network connection

### All Records Fail
- Verify CSV format matches template
- Check column names are correct
- Ensure required fields are present
- Validate data format (emails, phones)

### Some Records Fail
- Review error messages for each failed record
- Fix issues in original CSV
- Re-upload only the failed records

## Technical Details

### Backend Implementation
- **Route**: `/api/csv/upload-students`
- **Method**: POST
- **Middleware**: Multer for file upload
- **Parser**: csv-parser library
- **Storage**: Temporary file storage, auto-deleted

### Frontend Implementation
- **Component**: `CSVUpload.jsx`
- **Features**: Drag & drop, file validation, progress tracking
- **Integration**: User Management page

### Database Operations
- Atomic operations for each record
- Transaction-like behavior (each record independent)
- Automatic rollback on individual record failure
- No impact on successful records if some fail

## Future Enhancements

### Planned Features
- [ ] Bulk mentor upload
- [ ] Excel file support (.xlsx)
- [ ] Preview before processing
- [ ] Scheduled imports
- [ ] Email notifications to created users
- [ ] Bulk password reset
- [ ] Import history and logs
- [ ] Undo last import

## Support

For issues or questions:
1. Check this documentation
2. Review error messages carefully
3. Test with template file first
4. Contact system administrator

---

**Last Updated**: November 2024
**Version**: 1.0.0
