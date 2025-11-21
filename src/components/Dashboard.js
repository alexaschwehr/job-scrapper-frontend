import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { jobsAPI } from '../services/api';

const Dashboard = () => {
  const { logout } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    page_size: 20,
    total: 0,
    total_pages: 0,
  });

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [platform, setPlatform] = useState('');
  const [lastUpdateTime, setLastUpdateTime] = useState(null);

  // Manual fetch parameters
  const [fetchLocation, setFetchLocation] = useState('United States');
  const [fetchLimit, setFetchLimit] = useState(20);
  const [selectedPlatforms, setSelectedPlatforms] = useState(['linkedin', 'indeed', 'glassdoor', 'zip_recruiter', 'monster']);

  const platforms = [
    { value: '', label: 'All Platforms' },
    { value: 'linkedin', label: 'LinkedIn' },
    { value: 'indeed', label: 'Indeed' },
    { value: 'glassdoor', label: 'Glassdoor' },
    { value: 'zip_recruiter', label: 'ZipRecruiter' },
    { value: 'monster', label: 'Monster' },
  ];

  const availablePlatforms = [
    { value: 'linkedin', label: 'LinkedIn' },
    { value: 'indeed', label: 'Indeed' },
    { value: 'glassdoor', label: 'Glassdoor' },
    { value: 'zip_recruiter', label: 'ZipRecruiter' },
    { value: 'monster', label: 'Monster' },
  ];

  const fetchJobs = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const response = await jobsAPI.getAllJobs({
        page,
        page_size: pagination.page_size,
        platform,
        search_term: searchTerm,
      });

      if (response.status === 'success') {
        setJobs(response.data || []);
        setPagination(response.pagination || pagination);
        setLastUpdateTime(new Date());
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch jobs. Please try again.');
      console.error('Error fetching jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [platform, searchTerm]);

  const handleManualFetch = async () => {
    try {
      setFetching(true);
      setError(null);
      
      // Use searchTerm if available, otherwise default
      const searchQuery = searchTerm || 'software engineer';
      
      // Ensure at least one platform is selected
      const platformsToUse = selectedPlatforms.length > 0 
        ? selectedPlatforms 
        : ['linkedin', 'indeed', 'glassdoor', 'zip_recruiter', 'monster'];
      
      const response = await jobsAPI.triggerManualFetch({
        platforms: platformsToUse,
        search_term: searchQuery,
        location: fetchLocation,
        limit: fetchLimit,
      });
      
      // Refresh jobs after manual fetch
      await fetchJobs(pagination.page);
      
      if (response.status === 'success') {
        alert('Manual fetch triggered successfully!');
      } else {
        alert(response.message || 'Manual fetch triggered, but response was unexpected.');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.detail 
        ? (Array.isArray(err.response.data.detail) 
            ? err.response.data.detail.map(d => d.msg).join(', ')
            : err.response.data.detail)
        : 'Failed to trigger manual fetch. Please check your backend connection.';
      setError(errorMessage);
      alert(errorMessage);
      console.error('Error triggering manual fetch:', err);
    } finally {
      setFetching(false);
    }
  };

  const handlePlatformToggle = (platformValue) => {
    setSelectedPlatforms(prev => {
      if (prev.includes(platformValue)) {
        return prev.filter(p => p !== platformValue);
      } else {
        return [...prev, platformValue];
      }
    });
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.total_pages) {
      fetchJobs(newPage);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchJobs(1);
  };

  const handleExportCSV = () => {
    if (jobs.length === 0) {
      alert('No jobs to export. Please load jobs first.');
      return;
    }

    // CSV Headers
    const headers = ['Title', 'Company', 'Location', 'Platform', 'Posted Date', 'Fetched Date', 'Description', 'Link'];
    
    // Convert jobs to CSV rows
    const csvRows = [
      headers.join(','),
      ...jobs.map(job => {
        const escapeCSV = (field) => {
          if (!field) return '';
          // Escape quotes and wrap in quotes if contains comma, newline, or quote
          const stringField = String(field);
          if (stringField.includes(',') || stringField.includes('\n') || stringField.includes('"')) {
            return `"${stringField.replace(/"/g, '""')}"`;
          }
          return stringField;
        };

        return [
          escapeCSV(job.title || ''),
          escapeCSV(job.company || ''),
          escapeCSV(job.location || ''),
          escapeCSV(job.platform || ''),
          escapeCSV(job.posted_date ? formatDateForCSV(job.posted_date) : ''),
          escapeCSV(job.fetched_date ? formatDateForCSV(job.fetched_date) : ''),
          escapeCSV(job.description || ''),
          escapeCSV(job.link || ''),
        ].join(',');
      }),
    ];

    // Create CSV content
    const csvContent = csvRows.join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `jobs_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDateForCSV = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPlatformBadgeColor = (platform) => {
    const colors = {
      linkedin: 'bg-blue-100 text-blue-800',
      indeed: 'bg-purple-100 text-purple-800',
      glassdoor: 'bg-green-100 text-green-800',
      zip_recruiter: 'bg-orange-100 text-orange-800',
      monster: 'bg-red-100 text-red-800',
    };
    return colors[platform] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mr-3">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Job Fetcher Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              {lastUpdateTime && (
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Last updated:</span>{' '}
                  {lastUpdateTime.toLocaleTimeString()}
                </div>
              )}
              <button
                onClick={logout}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters and Actions */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search jobs by title, company, or description..."
                  className="w-full px-4 py-3 pl-11 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
                <svg
                  className="absolute left-3 top-3.5 h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </form>

            {/* Platform Filter */}
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
            >
              {platforms.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>

            {/* Action Buttons */}
            <div className="flex gap-3">
              {/* Export CSV Button */}
              <button
                onClick={handleExportCSV}
                disabled={loading || jobs.length === 0}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-semibold hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg whitespace-nowrap"
                title="Export current jobs to CSV"
              >
                <span className="flex items-center">
                  <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export CSV
                </span>
              </button>

              {/* Manual Fetch Button */}
              <button
                onClick={handleManualFetch}
                disabled={fetching}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg whitespace-nowrap"
              >
                {fetching ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Fetching...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Manual Fetch Now
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Manual Fetch Configuration */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Manual Fetch Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Location Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                <input
                  type="text"
                  value={fetchLocation}
                  onChange={(e) => setFetchLocation(e.target.value)}
                  placeholder="United States"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              {/* Limit Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Limit</label>
                <input
                  type="number"
                  value={fetchLimit}
                  onChange={(e) => setFetchLimit(parseInt(e.target.value) || 20)}
                  min="1"
                  max="100"
                  placeholder="20"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              {/* Search Term for Fetch */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search Term (for fetch)</label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="software engineer"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              {/* Platforms Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Platforms</label>
                <div className="flex flex-wrap gap-2">
                  {availablePlatforms.map((p) => (
                    <label key={p.value} className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedPlatforms.includes(p.value)}
                        onChange={() => handlePlatformToggle(p.value)}
                        className="mr-1.5 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700">{p.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Jobs Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <svg className="animate-spin h-12 w-12 text-blue-500 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-gray-600">Loading jobs...</p>
              </div>
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-20">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-600 text-lg">No jobs found</p>
              <p className="text-gray-500 text-sm mt-2">Try adjusting your filters or trigger a manual fetch</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Title
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Company
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Platform
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fetched Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {jobs.map((job) => (
                      <tr key={job._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{job.title || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{job.company || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{job.location || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPlatformBadgeColor(job.platform)}`}>
                            {job.platform || 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{formatDate(job.fetched_date)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {job.link ? (
                            <a
                              href={job.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-900 inline-flex items-center"
                            >
                              View
                              <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </a>
                          ) : (
                            <span className="text-gray-400">No link</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.total_pages > 1 && (
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Showing <span className="font-medium">{(pagination.page - 1) * pagination.page_size + 1}</span> to{' '}
                      <span className="font-medium">
                        {Math.min(pagination.page * pagination.page_size, pagination.total)}
                      </span>{' '}
                      of <span className="font-medium">{pagination.total}</span> results
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page === 1}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
                          let pageNum;
                          if (pagination.total_pages <= 5) {
                            pageNum = i + 1;
                          } else if (pagination.page <= 3) {
                            pageNum = i + 1;
                          } else if (pagination.page >= pagination.total_pages - 2) {
                            pageNum = pagination.total_pages - 4 + i;
                          } else {
                            pageNum = pagination.page - 2 + i;
                          }
                          return (
                            <button
                              key={pageNum}
                              onClick={() => handlePageChange(pageNum)}
                              className={`px-4 py-2 text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                pagination.page === pageNum
                                  ? 'bg-blue-500 text-white'
                                  : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>
                      <button
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page === pagination.total_pages}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;

