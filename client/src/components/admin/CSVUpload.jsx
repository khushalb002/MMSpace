import { useState, useRef } from 'react'
import { Upload, Download, FileText, CheckCircle, XCircle, AlertCircle, X } from 'lucide-react'
import { toast } from 'react-hot-toast'
import api from '../../services/api'

const CSVUpload = ({ onClose, onSuccess }) => {
    const [file, setFile] = useState(null)
    const [uploading, setUploading] = useState(false)
    const [results, setResults] = useState(null)
    const fileInputRef = useRef(null)

    const handleFileSelect = (e) => {
        const selectedFile = e.target.files[0]
        if (selectedFile) {
            if (selectedFile.type === 'text/csv' || selectedFile.name.endsWith('.csv')) {
                setFile(selectedFile)
                setResults(null)
            } else {
                toast.error('Please select a CSV file')
            }
        }
    }

    const handleDragOver = (e) => {
        e.preventDefault()
        e.stopPropagation()
    }

    const handleDrop = (e) => {
        e.preventDefault()
        e.stopPropagation()

        const droppedFile = e.dataTransfer.files[0]
        if (droppedFile) {
            if (droppedFile.type === 'text/csv' || droppedFile.name.endsWith('.csv')) {
                setFile(droppedFile)
                setResults(null)
            } else {
                toast.error('Please drop a CSV file')
            }
        }
    }

    const handleUpload = async () => {
        if (!file) {
            toast.error('Please select a file first')
            return
        }

        setUploading(true)
        const formData = new FormData()
        formData.append('csvFile', file)

        try {
            const response = await api.post('/csv/upload-students', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            })

            setResults(response.data)
            toast.success(`Successfully processed ${response.data.summary.total} records`)

            if (onSuccess) {
                onSuccess(response.data)
            }
        } catch (error) {
            console.error('Upload error:', error)
            toast.error(error.response?.data?.message || 'Failed to upload CSV file')
        } finally {
            setUploading(false)
        }
    }

    const handleDownloadTemplate = async () => {
        try {
            const response = await api.get('/csv/template', {
                responseType: 'blob'
            })

            const url = window.URL.createObjectURL(new Blob([response.data]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', 'student_upload_template.csv')
            document.body.appendChild(link)
            link.click()
            link.remove()

            toast.success('Template downloaded successfully')
        } catch (error) {
            console.error('Download error:', error)
            toast.error('Failed to download template')
        }
    }

    const handleReset = () => {
        setFile(null)
        setResults(null)
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-slate-700/50 max-w-4xl w-full max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200/50 dark:border-slate-700/50">
                    <div className="flex items-center space-x-3">
                        <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
                            <Upload className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
                                Upload Student Data
                            </h2>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                Bulk import students via CSV file
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
                    >
                        <X className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
                    {/* Instructions */}
                    <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                        <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2 flex items-center">
                            <AlertCircle className="h-4 w-4 mr-2" />
                            CSV Format Requirements
                        </h3>
                        <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1 ml-6 list-disc">
                            <li><strong>rollNo</strong> - Student roll number (required)</li>
                            <li><strong>fullName</strong> - Student full name (optional)</li>
                            <li><strong>studentEmail</strong> - Student email address (required)</li>
                            <li><strong>studentPhone</strong> - Student phone number, 10 digits (required)</li>
                            <li><strong>parentsPhone</strong> - Parent phone number (optional)</li>
                            <li><strong>parentsEmail</strong> - Parent email address (optional)</li>
                            <li><strong>mentorEmail</strong> - Mentor email address (optional)</li>
                            <li><strong>class</strong> - Class/Grade (optional)</li>
                            <li><strong>section</strong> - Section (optional)</li>
                        </ul>
                        <p className="text-sm text-blue-800 dark:text-blue-400 mt-3">
                            <strong>Note:</strong> Default password will be <code className="bg-blue-100 dark:bg-blue-900/50 px-2 py-0.5 rounded">rollNo@123</code>
                        </p>
                    </div>

                    {/* Download Template Button */}
                    <button
                        onClick={handleDownloadTemplate}
                        className="w-full mb-6 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center justify-center space-x-2"
                    >
                        <Download className="h-5 w-5" />
                        <span>Download CSV Template</span>
                    </button>

                    {/* File Upload Area */}
                    {!results && (
                        <div
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                            className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-2xl p-8 text-center hover:border-blue-500 dark:hover:border-blue-400 transition-colors cursor-pointer"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".csv"
                                onChange={handleFileSelect}
                                className="hidden"
                            />

                            {file ? (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-center">
                                        <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-full">
                                            <FileText className="h-12 w-12 text-green-600 dark:text-green-400" />
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-lg font-semibold text-slate-800 dark:text-white">
                                            {file.name}
                                        </p>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">
                                            {(file.size / 1024).toFixed(2)} KB
                                        </p>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            handleReset()
                                        }}
                                        className="text-sm text-red-600 dark:text-red-400 hover:underline"
                                    >
                                        Remove file
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-center">
                                        <div className="p-4 bg-slate-100 dark:bg-slate-700 rounded-full">
                                            <Upload className="h-12 w-12 text-slate-400" />
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-lg font-semibold text-slate-800 dark:text-white mb-2">
                                            Drop your CSV file here
                                        </p>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">
                                            or click to browse
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Results Display */}
                    {results && (
                        <div className="space-y-4">
                            {/* Summary */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                        {results.summary.total}
                                    </div>
                                    <div className="text-sm text-blue-800 dark:text-blue-300">Total Records</div>
                                </div>
                                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                        {results.summary.created}
                                    </div>
                                    <div className="text-sm text-green-800 dark:text-green-300">Created</div>
                                </div>
                                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800">
                                    <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                                        {results.summary.updated}
                                    </div>
                                    <div className="text-sm text-yellow-800 dark:text-yellow-300">Updated</div>
                                </div>
                                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                                        {results.summary.failed}
                                    </div>
                                    <div className="text-sm text-red-800 dark:text-red-300">Failed</div>
                                </div>
                            </div>

                            {/* Detailed Results */}
                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                {/* Success */}
                                {results.details.success.length > 0 && (
                                    <div>
                                        <h4 className="font-semibold text-green-800 dark:text-green-300 mb-2 flex items-center">
                                            <CheckCircle className="h-4 w-4 mr-2" />
                                            Successfully Created ({results.details.success.length})
                                        </h4>
                                        <div className="space-y-2">
                                            {results.details.success.map((item, index) => (
                                                <div key={index} className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-sm">
                                                    <div className="font-medium text-green-900 dark:text-green-300">
                                                        Row {item.row}: {item.rollNo} - {item.email}
                                                    </div>
                                                    <div className="text-green-700 dark:text-green-400 text-xs mt-1">
                                                        Default Password: <code className="bg-green-100 dark:bg-green-900/50 px-2 py-0.5 rounded">{item.defaultPassword}</code>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Updated */}
                                {results.details.updated.length > 0 && (
                                    <div>
                                        <h4 className="font-semibold text-yellow-800 dark:text-yellow-300 mb-2 flex items-center">
                                            <AlertCircle className="h-4 w-4 mr-2" />
                                            Updated ({results.details.updated.length})
                                        </h4>
                                        <div className="space-y-2">
                                            {results.details.updated.map((item, index) => (
                                                <div key={index} className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-sm">
                                                    <div className="font-medium text-yellow-900 dark:text-yellow-300">
                                                        Row {item.row}: {item.rollNo} - {item.email}
                                                    </div>
                                                    <div className="text-yellow-700 dark:text-yellow-400 text-xs mt-1">
                                                        {item.message}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Failed */}
                                {results.details.failed.length > 0 && (
                                    <div>
                                        <h4 className="font-semibold text-red-800 dark:text-red-300 mb-2 flex items-center">
                                            <XCircle className="h-4 w-4 mr-2" />
                                            Failed ({results.details.failed.length})
                                        </h4>
                                        <div className="space-y-2">
                                            {results.details.failed.map((item, index) => (
                                                <div key={index} className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-sm">
                                                    <div className="font-medium text-red-900 dark:text-red-300">
                                                        Row {item.row}
                                                    </div>
                                                    <div className="text-red-700 dark:text-red-400 text-xs mt-1">
                                                        Error: {item.error}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Reset Button */}
                            <button
                                onClick={handleReset}
                                className="w-full px-4 py-3 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white rounded-xl font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                            >
                                Upload Another File
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer */}
                {!results && (
                    <div className="flex items-center justify-end space-x-3 p-6 border-t border-slate-200/50 dark:border-slate-700/50">
                        <button
                            onClick={onClose}
                            className="px-6 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white rounded-xl font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleUpload}
                            disabled={!file || uploading}
                            className="px-6 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                        >
                            {uploading ? 'Uploading...' : 'Upload & Process'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}

export default CSVUpload
