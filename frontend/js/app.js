// API Configuration
const API_BASE = 'http://localhost:5000/api';

// State
let currentUser = null;
let currentView = 'login';

// Helper Functions
const getToken = () => localStorage.getItem('token');
const setToken = (token) => localStorage.setItem('token', token);
const clearToken = () => localStorage.removeItem('token');

const showToast = (message, type = 'success') => {
    const toast = document.createElement('div');
    toast.className = `toast fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white ${type === 'success' ? 'bg-green-500' : 'bg-red-500'} fade-in`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
};

const apiRequest = async (endpoint, options = {}) => {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Request failed');
    }
    return data;
};

// Navigation
const updateNav = () => {
    const navButtons = document.getElementById('nav-buttons');
    if (!currentUser) {
        navButtons.innerHTML = `
            <button onclick="showLogin()" class="px-4 py-2 text-white hover:bg-white/20 rounded-lg transition">Login</button>
            <button onclick="showRegister()" class="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition">Register</button>
        `;
    } else {
        let roleButtons = '';
        if (currentUser.role === 'admin') {
            roleButtons = `
                <button onclick="loadAdminDashboard()" class="px-4 py-2 text-white hover:bg-white/20 rounded-lg transition">Dashboard</button>
                <button onclick="loadAdminUsers()" class="px-4 py-2 text-white hover:bg-white/20 rounded-lg transition">Users</button>
                <button onclick="loadAdminResults()" class="px-4 py-2 text-white hover:bg-white/20 rounded-lg transition">Results</button>
            `;
        } else if (currentUser.role === 'voter') {
            roleButtons = `
                <button onclick="loadVoterDashboard()" class="px-4 py-2 text-white hover:bg-white/20 rounded-lg transition">Vote</button>
                <button onclick="loadVoterResults()" class="px-4 py-2 text-white hover:bg-white/20 rounded-lg transition">Results</button>
            `;
        } else if (currentUser.role === 'candidate') {
            roleButtons = `
                <button onclick="loadCandidateDashboard()" class="px-4 py-2 text-white hover:bg-white/20 rounded-lg transition">Dashboard</button>
                <button onclick="loadCandidateProfile()" class="px-4 py-2 text-white hover:bg-white/20 rounded-lg transition">Profile</button>
                <button onclick="loadCandidateRankings()" class="px-4 py-2 text-white hover:bg-white/20 rounded-lg transition">Rankings</button>
            `;
        }
        navButtons.innerHTML = `
            <span class="px-3 py-2 text-purple-300">${currentUser.email}</span>
            ${roleButtons}
            <button onclick="logout()" class="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition">Logout</button>
        `;
    }
};

// Auth Functions
const showLogin = () => {
    currentView = 'login';
    document.getElementById('app').innerHTML = `
        <div class="max-w-md mx-auto bg-white/10 backdrop-blur-lg rounded-2xl p-8 fade-in">
            <h2 class="text-3xl font-bold text-white mb-6 text-center">Welcome Back</h2>
            <form id="loginForm" class="space-y-4">
                <div>
                    <label class="block text-white mb-2">Email</label>
                    <input type="email" id="email" required class="w-full px-4 py-2 rounded-lg bg-white/20 text-white border border-white/30 focus:outline-none focus:border-purple-500">
                </div>
                <div>
                    <label class="block text-white mb-2">Password</label>
                    <input type="password" id="password" required class="w-full px-4 py-2 rounded-lg bg-white/20 text-white border border-white/30 focus:outline-none focus:border-purple-500">
                </div>
                <button type="submit" class="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 rounded-lg transition">Login</button>
            </form>
            <p class="text-center text-white/70 mt-4">Don't have an account? <button onclick="showRegister()" class="text-purple-400 hover:underline">Register</button></p>
        </div>
    `;
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const data = await apiRequest('/auth/login', {
                method: 'POST',
                body: JSON.stringify({
                    email: document.getElementById('email').value,
                    password: document.getElementById('password').value
                })
            });
            setToken(data.token);
            currentUser = data.user;
            updateNav();
            showToast('Login successful!');
            if (currentUser.role === 'admin') loadAdminDashboard();
            else if (currentUser.role === 'voter') loadVoterDashboard();
            else loadCandidateDashboard();
        } catch (err) {
            showToast(err.message, 'error');
        }
    });
};

const showRegister = () => {
    currentView = 'register';
    document.getElementById('app').innerHTML = `
        <div class="max-w-md mx-auto bg-white/10 backdrop-blur-lg rounded-2xl p-8 fade-in">
            <h2 class="text-3xl font-bold text-white mb-6 text-center">Create Account</h2>
            <form id="registerForm" class="space-y-4">
                <div>
                    <label class="block text-white mb-2">Email</label>
                    <input type="email" id="email" required class="w-full px-4 py-2 rounded-lg bg-white/20 text-white border border-white/30 focus:outline-none focus:border-purple-500">
                </div>
                <div>
                    <label class="block text-white mb-2">Password (min 6 chars)</label>
                    <input type="password" id="password" required class="w-full px-4 py-2 rounded-lg bg-white/20 text-white border border-white/30 focus:outline-none focus:border-purple-500">
                </div>
                <div>
                    <label class="block text-white mb-2">Role</label>
                    <select id="role" class="w-full px-4 py-2 rounded-lg bg-white/20 text-white border border-white/30 focus:outline-none focus:border-purple-500">
                        <option value="voter">Voter</option>
                        <option value="candidate">Candidate</option>
                    </select>
                </div>
                <div id="candidateFields" style="display:none;">
                    <div>
                        <label class="block text-white mb-2">Full Name</label>
                        <input type="text" id="name" class="w-full px-4 py-2 rounded-lg bg-white/20 text-white border border-white/30">
                    </div>
                    <div>
                        <label class="block text-white mb-2">Position</label>
                        <input type="text" id="position" class="w-full px-4 py-2 rounded-lg bg-white/20 text-white border border-white/30">
                    </div>
                    <div>
                        <label class="block text-white mb-2">Bio (Optional)</label>
                        <textarea id="bio" rows="3" class="w-full px-4 py-2 rounded-lg bg-white/20 text-white border border-white/30"></textarea>
                    </div>
                </div>
                <button type="submit" class="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 rounded-lg transition">Register</button>
            </form>
            <p class="text-center text-white/70 mt-4">Already have an account? <button onclick="showLogin()" class="text-purple-400 hover:underline">Login</button></p>
        </div>
    `;

    document.getElementById('role').addEventListener('change', (e) => {
        const candidateFields = document.getElementById('candidateFields');
        candidateFields.style.display = e.target.value === 'candidate' ? 'block' : 'none';
    });

    document.getElementById('registerForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const role = document.getElementById('role').value;
        const payload = {
            email: document.getElementById('email').value,
            password: document.getElementById('password').value,
            role: role
        };
        if (role === 'candidate') {
            payload.name = document.getElementById('name').value;
            payload.position = document.getElementById('position').value;
            payload.bio = document.getElementById('bio').value;
        }
        try {
            await apiRequest('/auth/register', {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            showToast('Registration successful! Awaiting admin verification.');
            showLogin();
        } catch (err) {
            showToast(err.message, 'error');
        }
    });
};

// Admin Functions
const loadAdminDashboard = async () => {
    try {
        const data = await apiRequest('/admin/dashboard');
        document.getElementById('app').innerHTML = `
            <div class="fade-in">
                <h1 class="text-3xl font-bold text-white mb-6">Admin Dashboard</h1>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div class="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl p-6">
                        <i class="ri-group-line text-4xl text-white mb-2"></i>
                        <h3 class="text-white/80 text-sm">Total Voters</h3>
                        <p class="text-3xl font-bold text-white">${data.voters.total}</p>
                        <p class="text-green-300 text-sm">${data.voters.verified} verified</p>
                    </div>
                    <div class="bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl p-6">
                        <i class="ri-user-star-line text-4xl text-white mb-2"></i>
                        <h3 class="text-white/80 text-sm">Total Candidates</h3>
                        <p class="text-3xl font-bold text-white">${data.candidates.total}</p>
                        <p class="text-green-300 text-sm">${data.candidates.verified} verified</p>
                    </div>
                    <div class="bg-gradient-to-br from-green-600 to-green-800 rounded-xl p-6">
                        <i class="ri-vote-line text-4xl text-white mb-2"></i>
                        <h3 class="text-white/80 text-sm">Votes Cast</h3>
                        <p class="text-3xl font-bold text-white">${data.votes.total}</p>
                        <p class="text-yellow-300 text-sm">${data.voters.voted} voters participated</p>
                    </div>
                </div>
                <div class="bg-white/10 backdrop-blur-lg rounded-xl p-6">
                    <div class="flex justify-between items-center mb-4">
                        <h2 class="text-xl font-bold text-white">Election Control</h2>
                        <div class="flex space-x-3">
                            ${!data.election.is_active ? 
                                `<button onclick="startElection()" class="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition">Start Election</button>` :
                                `<button onclick="endElection()" class="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition">End Election</button>`
                            }
                            <button onclick="sendResultsEmail()" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition">Email Results</button>
                        </div>
                    </div>
                    <div class="text-white/80">
                        <p>Status: <span class="${data.election.is_active ? 'text-green-400' : 'text-red-400'} font-semibold">${data.election.is_active ? 'ACTIVE' : 'INACTIVE'}</span></p>
                        ${data.election.started_at ? `<p>Started: ${new Date(data.election.started_at).toLocaleString()}</p>` : ''}
                        ${data.election.ended_at ? `<p>Ended: ${new Date(data.election.ended_at).toLocaleString()}</p>` : ''}
                    </div>
                </div>
            </div>
        `;
    } catch (err) {
        showToast(err.message, 'error');
    }
};

const loadAdminUsers = async () => {
    try {
        const data = await apiRequest('/admin/users');
        document.getElementById('app').innerHTML = `
            <div class="fade-in">
                <h1 class="text-3xl font-bold text-white mb-6">User Management</h1>
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div class="bg-white/10 backdrop-blur-lg rounded-xl p-6">
                        <h2 class="text-xl font-bold text-white mb-4">Voters</h2>
                        <div class="space-y-3 max-h-96 overflow-y-auto">
                            ${data.voters.map(voter => `
                                <div class="bg-white/5 rounded-lg p-3 flex justify-between items-center">
                                    <div>
                                        <p class="text-white font-semibold">${voter.email}</p>
                                        <p class="text-sm ${voter.is_verified ? 'text-green-400' : 'text-yellow-400'}">${voter.is_verified ? 'Verified' : 'Pending'}</p>
                                    </div>
                                    ${!voter.is_verified ? `
                                        <button onclick="verifyUser(${voter.id}, true)" class="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm transition">Verify</button>
                                    ` : ''}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    <div class="bg-white/10 backdrop-blur-lg rounded-xl p-6">
                        <h2 class="text-xl font-bold text-white mb-4">Candidates</h2>
                        <div class="space-y-3 max-h-96 overflow-y-auto">
                            ${data.candidates.map(candidate => `
                                <div class="bg-white/5 rounded-lg p-3">
                                    <div class="flex justify-between items-start">
                                        <div>
                                            <p class="text-white font-semibold">${candidate.name}</p>
                                            <p class="text-sm text-purple-300">${candidate.position}</p>
                                            <p class="text-xs text-white/60">${candidate.email}</p>
                                        </div>
                                        ${!candidate.is_verified ? `
                                            <button onclick="verifyUser(${candidate.id}, true)" class="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm transition">Verify</button>
                                        ` : '<span class="text-green-400 text-sm">✓ Verified</span>'}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    } catch (err) {
        showToast(err.message, 'error');
    }
};

const loadAdminResults = async () => {
    try {
        const data = await apiRequest('/admin/results');
        document.getElementById('app').innerHTML = `
            <div class="fade-in">
                <h1 class="text-3xl font-bold text-white mb-6">Election Results</h1>
                <div class="bg-white/10 backdrop-blur-lg rounded-xl p-6">
                    <div class="space-y-4">
                        ${data.results.map((candidate, idx) => `
                            <div class="bg-white/5 rounded-lg p-4">
                                <div class="flex justify-between items-center">
                                    <div>
                                        <span class="text-2xl font-bold text-purple-400 mr-3">#${idx + 1}</span>
                                        <span class="text-white font-semibold text-lg">${candidate.name}</span>
                                        <span class="text-purple-300 text-sm ml-2">${candidate.position}</span>
                                    </div>
                                    <div class="text-right">
                                        <span class="text-2xl font-bold text-white">${candidate.total_votes}</span>
                                        <span class="text-white/60 text-sm"> votes</span>
                                    </div>
                                </div>
                                <div class="mt-2 bg-white/10 rounded-full h-2 overflow-hidden">
                                    <div class="bg-purple-500 h-full rounded-full" style="width: ${Math.min(100, (candidate.total_votes / (data.results[0]?.total_votes || 1)) * 100)}%"></div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    } catch (err) {
        showToast(err.message, 'error');
    }
};

// Voter Functions
const loadVoterDashboard = async () => {
    try {
        const [candidates, status] = await Promise.all([
            apiRequest('/voter/candidates'),
            apiRequest('/voter/status')
        ]);

        document.getElementById('app').innerHTML = `
            <div class="fade-in">
                <h1 class="text-3xl font-bold text-white mb-6">Cast Your Vote</h1>
                ${status.hasVoted ? `
                    <div class="bg-yellow-500/20 border border-yellow-500 rounded-xl p-6 text-center mb-6">
                        <i class="ri-checkbox-circle-line text-5xl text-yellow-400 mb-2"></i>
                        <p class="text-white text-lg">You have already cast your vote. Thank you for participating!</p>
                    </div>
                ` : !status.electionActive ? `
                    <div class="bg-red-500/20 border border-red-500 rounded-xl p-6 text-center mb-6">
                        <i class="ri-error-warning-line text-5xl text-red-400 mb-2"></i>
                        <p class="text-white text-lg">Voting is currently not active.</p>
                    </div>
                ` : `
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        ${candidates.map(candidate => `
                            <div class="bg-white/10 backdrop-blur-lg rounded-xl p-6 card-hover">
                                ${candidate.photo_url ? `<img src="${candidate.photo_url}" class="w-24 h-24 rounded-full mx-auto mb-4 object-cover">` : `<div class="w-24 h-24 rounded-full bg-purple-600 mx-auto mb-4 flex items-center justify-center"><i class="ri-user-line text-4xl text-white"></i></div>`}
                                <h3 class="text-xl font-bold text-white text-center">${candidate.name}</h3>
                                <p class="text-purple-300 text-center mb-2">${candidate.position}</p>
                                <p class="text-white/70 text-sm text-center mb-4">${candidate.bio || 'No bio provided'}</p>
                                <button onclick="vote(${candidate.id})" class="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 rounded-lg transition">Vote</button>
                            </div>
                        `).join('')}
                    </div>
                `}
            </div>
        `;
    } catch (err) {
        showToast(err.message, 'error');
    }
};

const loadVoterResults = async () => {
    try {
        const data = await apiRequest('/voter/results');
        document.getElementById('app').innerHTML = `
            <div class="fade-in">
                <h1 class="text-3xl font-bold text-white mb-6">Final Results</h1>
                <div class="bg-white/10 backdrop-blur-lg rounded-xl p-6">
                    <div class="space-y-4">
                        ${data.results.map((candidate, idx) => `
                            <div class="bg-white/5 rounded-lg p-4">
                                <div class="flex justify-between items-center">
                                    <div>
                                        <span class="text-2xl font-bold text-purple-400 mr-3">#${idx + 1}</span>
                                        <span class="text-white font-semibold text-lg">${candidate.name}</span>
                                        <span class="text-purple-300 text-sm ml-2">${candidate.position}</span>
                                    </div>
                                    <div class="text-right">
                                        <span class="text-2xl font-bold text-white">${candidate.total_votes}</span>
                                        <span class="text-white/60 text-sm"> votes</span>
                                    </div>
                                </div>
                                <div class="mt-2 bg-white/10 rounded-full h-2 overflow-hidden">
                                    <div class="bg-purple-500 h-full rounded-full" style="width: ${Math.min(100, (candidate.total_votes / (data.results[0]?.total_votes || 1)) * 100)}%"></div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    } catch (err) {
        showToast(err.message, 'error');
    }
};

// Candidate Functions
const loadCandidateDashboard = async () => {
    try {
        const data = await apiRequest('/candidate/dashboard');
        document.getElementById('app').innerHTML = `
            <div class="fade-in">
                <h1 class="text-3xl font-bold text-white mb-6">Candidate Dashboard</h1>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div class="bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl p-6">
                        <h3 class="text-white/80 text-sm">Your Votes</h3>
                        <p class="text-4xl font-bold text-white">${data.profile.totalVotes}</p>
                        <p class="text-purple-200 text-sm">Rank: ${data.rank} / ${data.totalCandidates}</p>
                    </div>
                    <div class="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl p-6">
                        <h3 class="text-white/80 text-sm">Election Status</h3>
                        <p class="text-2xl font-bold text-white">${data.election.is_active ? 'Active' : 'Ended'}</p>
                        ${data.election.ended_at ? `<p class="text-sm text-white/70">Ended: ${new Date(data.election.ended_at).toLocaleDateString()}</p>` : ''}
                    </div>
                </div>
                <div class="bg-white/10 backdrop-blur-lg rounded-xl p-6">
                    <h2 class="text-xl font-bold text-white mb-4">Your Profile</h2>
                    <div class="space-y-2">
                        <p><span class="text-white/60">Name:</span> <span class="text-white">${data.profile.name}</span></p>
                        <p><span class="text-white/60">Position:</span> <span class="text-white">${data.profile.position}</span></p>
                        <p><span class="text-white/60">Email:</span> <span class="text-white">${data.profile.email}</span></p>
                        <p><span class="text-white/60">Status:</span> <span class="${data.profile.is_verified ? 'text-green-400' : 'text-yellow-400'}">${data.profile.is_verified ? 'Verified' : 'Pending Verification'}</span></p>
                    </div>
                </div>
            </div>
        `;
    } catch (err) {
        showToast(err.message, 'error');
    }
};

const loadCandidateProfile = async () => {
    try {
        const profile = await apiRequest('/candidate/profile');
        document.getElementById('app').innerHTML = `
            <div class="max-w-2xl mx-auto fade-in">
                <h1 class="text-3xl font-bold text-white mb-6">Edit Profile</h1>
                <div class="bg-white/10 backdrop-blur-lg rounded-xl p-6">
                    <form id="profileForm" class="space-y-4">
                        <div>
                            <label class="block text-white mb-2">Full Name</label>
                            <input type="text" id="name" value="${profile.name}" required class="w-full px-4 py-2 rounded-lg bg-white/20 text-white border border-white/30">
                        </div>
                        <div>
                            <label class="block text-white mb-2">Position</label>
                            <input type="text" id="position" value="${profile.position}" required class="w-full px-4 py-2 rounded-lg bg-white/20 text-white border border-white/30">
                        </div>
                        <div>
                            <label class="block text-white mb-2">Bio</label>
                            <textarea id="bio" rows="4" class="w-full px-4 py-2 rounded-lg bg-white/20 text-white border border-white/30">${profile.bio || ''}</textarea>
                        </div>
                        <div>
                            <label class="block text-white mb-2">Photo URL</label>
                            <input type="text" id="photoUrl" value="${profile.photo_url || ''}" class="w-full px-4 py-2 rounded-lg bg-white/20 text-white border border-white/30">
                        </div>
                        <button type="submit" class="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 rounded-lg transition">Update Profile</button>
                    </form>
                </div>
            </div>
        `;
        document.getElementById('profileForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                await apiRequest('/candidate/profile', {
                    method: 'PUT',
                    body: JSON.stringify({
                        name: document.getElementById('name').value,
                        position: document.getElementById('position').value,
                        bio: document.getElementById('bio').value,
                        photoUrl: document.getElementById('photoUrl').value
                    })
                });
                showToast('Profile updated successfully!');
                loadCandidateDashboard();
            } catch (err) {
                showToast(err.message, 'error');
            }
        });
    } catch (err) {
        showToast(err.message, 'error');
    }
};

const loadCandidateRankings = async () => {
    try {
        const rankings = await apiRequest('/candidate/rankings');
        document.getElementById('app').innerHTML = `
            <div class="fade-in">
                <h1 class="text-3xl font-bold text-white mb-6">Candidate Rankings</h1>
                <div class="bg-white/10 backdrop-blur-lg rounded-xl p-6">
                    <div class="space-y-4">
                        ${rankings.map((candidate, idx) => `
                            <div class="bg-white/5 rounded-lg p-4">
                                <div class="flex justify-between items-center">
                                    <div>
                                        <span class="text-2xl font-bold text-purple-400 mr-3">#${idx + 1}</span>
                                        <span class="text-white font-semibold text-lg">${candidate.name}</span>
                                        <span class="text-purple-300 text-sm ml-2">${candidate.position}</span>
                                    </div>
                                    <div class="text-right">
                                        <span class="text-2xl font-bold text-white">${candidate.total_votes}</span>
                                        <span class="text-white/60 text-sm"> votes</span>
                                    </div>
                                </div>
                                <div class="mt-2 bg-white/10 rounded-full h-2 overflow-hidden">
                                    <div class="bg-purple-500 h-full rounded-full" style="width: ${Math.min(100, (candidate.total_votes / (rankings[0]?.total_votes || 1)) * 100)}%"></div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    } catch (err) {
        showToast(err.message, 'error');
    }
};

// Action Functions
const verifyUser = async (userId, status) => {
    try {
        await apiRequest('/admin/verify', {
            method: 'POST',
            body: JSON.stringify({ userId, status })
        });
        showToast(`User ${status ? 'verified' : 'rejected'} successfully`);
        loadAdminUsers();
    } catch (err) {
        showToast(err.message, 'error');
    }
};

const startElection = async () => {
    try {
        await apiRequest('/admin/election', {
            method: 'POST',
            body: JSON.stringify({ action: 'start' })
        });
        showToast('Election started!');
        loadAdminDashboard();
    } catch (err) {
        showToast(err.message, 'error');
    }
};

const endElection = async () => {
    try {
        await apiRequest('/admin/election', {
            method: 'POST',
            body: JSON.stringify({ action: 'end' })
        });
        showToast('Election ended!');
        loadAdminDashboard();
    } catch (err) {
        showToast(err.message, 'error');
    }
};

const sendResultsEmail = async () => {
    try {
        await apiRequest('/admin/send-results', { method: 'POST' });
        showToast('Results emailed to all candidates!');
    } catch (err) {
        showToast(err.message, 'error');
    }
};

const vote = async (candidateId) => {
    if (!confirm('Are you sure you want to vote for this candidate? This action cannot be undone.')) return;
    try {
        await apiRequest('/voter/vote', {
            method: 'POST',
            body: JSON.stringify({ candidateId })
        });
        showToast('Vote cast successfully!');
        loadVoterDashboard();
    } catch (err) {
        showToast(err.message, 'error');
    }
};

const logout = () => {
    clearToken();
    currentUser = null;
    updateNav();
    showLogin();
    showToast('Logged out successfully');
};

// Initialize
const init = async () => {
    const token = getToken();
    if (token) {
        try {
            // Try to get user info from token or verify
            const response = await fetch(`${API_BASE}/admin/dashboard`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                // Just to validate token - we don't have a /me endpoint
                // We'll extract from localStorage or set default
                // For simplicity, we'll redirect to login if token invalid
            }
        } catch (err) {
            clearToken();
        }
    }
    showLogin();
};

// Make functions global
window.showLogin = showLogin;
window.showRegister = showRegister;
window.loadAdminDashboard = loadAdminDashboard;
window.loadAdminUsers = loadAdminUsers;
window.loadAdminResults = loadAdminResults;
window.loadVoterDashboard = loadVoterDashboard;
window.loadVoterResults = loadVoterResults;
window.loadCandidateDashboard = loadCandidateDashboard;
window.loadCandidateProfile = loadCandidateProfile;
window.loadCandidateRankings = loadCandidateRankings;
window.verifyUser = verifyUser;
window.startElection = startElection;
window.endElection = endElection;
window.sendResultsEmail = sendResultsEmail;
window.vote = vote;
window.logout = logout;

init();