import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { UserProfile } from '../types';
import { ChatBot } from './ChatBot';
import { Button } from './ui/Button';
import { Input, TextArea } from './ui/Input';

export const ProfileView: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<UserProfile | null>(null);
  const [pollingEnabled, setPollingEnabled] = useState(!(location.state as any)?.isNewlyCreated);  useEffect(() => {
    // Retrieve from storage
    const stored = localStorage.getItem('userProfile');
    if (stored) {
      const parsed = JSON.parse(stored);
      setProfile(parsed);
      setEditData(parsed);
    } else {
      navigate('/login');
    }
  }, [navigate]);

  // If profile was just created, delay polling to avoid race conditions (10s grace period)
  useEffect(() => {
    if ((location.state as any)?.isNewlyCreated && !pollingEnabled) {
      const timer = setTimeout(() => {
        console.log('[PROFILE] Grace period ended, enabling polling');
        setPollingEnabled(true);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [location.state, pollingEnabled]);

  // Removed constant polling - status updates are managed by admin portal
  // Profile changes are reflected when user refreshes or logs in again

  if (!profile || !editData) return null;

  const isClient = profile.role === 'client';
  const isProvider = profile.role === 'provider';

  const handleSave = async () => {
      try {
        // Use _id if available, otherwise use id
        const profileId = editData._id || editData.id;
        console.log('[PROFILE] Saving profile with id:', profileId);
        
        // Save to backend with _id field
        const response = await fetch('/api/profiles', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...editData, _id: profileId })
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('[PROFILE] Save failed:', response.status, errorText);
          throw new Error('Failed to save profile');
        }
        
        const savedProfile = await response.json();
        console.log('[PROFILE] Save successful:', savedProfile);
        setProfile(savedProfile);
        setEditData(savedProfile);
        localStorage.setItem('userProfile', JSON.stringify(savedProfile));
        setIsEditing(false);
      } catch (err) {
        console.error('Error saving profile:', err);
        alert('Failed to save profile. Please try again.');
      }
  };

  // Helper for array updates in edit mode
  const handleArrayChange = (section: 'clinical' | 'providerDetails', key: string, value: string) => {
     if (section === 'providerDetails' && editData.providerDetails) {
         setEditData({
             ...editData,
             providerDetails: {
                 ...editData.providerDetails,
                 [key]: value.split(',').map(s => s.trim())
             }
         });
     }
  };

  const handleDetailChange = (key: string, value: string) => {
      if (editData.providerDetails) {
          setEditData({
              ...editData,
              providerDetails: {
                  ...editData.providerDetails,
                  [key]: value
              }
          });
      }
  };

  const handleDownloadResume = () => {
      if (profile.providerDetails?.resumeFileData && profile.providerDetails?.resumeFileName) {
          const link = document.createElement('a');
          link.href = profile.providerDetails.resumeFileData;
          link.download = profile.providerDetails.resumeFileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
      }
  };

  const handleResumeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Max 5MB
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        if (editData.providerDetails) {
          setEditData({
            ...editData,
            providerDetails: {
              ...editData.providerDetails,
              resumeFileData: base64,
              resumeFileName: file.name
            }
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 relative">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header Actions */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center animate-fade-in gap-4">
            <div className="flex items-center gap-3">
                 <div className={`w-12 h-12 rounded-lg ${isProvider ? 'bg-blue-600' : 'bg-teal-600'} flex items-center justify-center text-white font-bold text-2xl shadow-lg`}>
                    {profile.basicInfo.fullName.charAt(0)}
                 </div>
                 <div>
                    <h1 className="text-2xl font-bold text-slate-800">{profile.basicInfo.fullName}</h1>
                    <div className="flex items-center gap-2">
                         <span className="text-xs text-slate-500">TheMindNetwork ID: {profile.id.slice(0,8)}</span>
                         <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wide ${isProvider ? 'bg-blue-100 text-blue-700' : 'bg-teal-100 text-teal-700'}`}>
                             {isProvider ? 'Provider' : 'Client'}
                         </span>
                    </div>
                 </div>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
                <Button variant="secondary" onClick={() => setIsEditing(!isEditing)} className="flex-1 md:flex-none">
                    <i className={`fas ${isEditing ? 'fa-times' : 'fa-edit'} mr-2`}></i>
                    {isEditing ? 'Cancel' : 'Edit Profile'}
                </Button>
                <Button variant="outline" onClick={() => {
                    localStorage.removeItem('authToken');
                    localStorage.removeItem('userProfile');
                    localStorage.removeItem('userPhone');
                    navigate('/');
                }} className="flex-1 md:flex-none">
                    <i className="fas fa-sign-out-alt mr-2"></i> Log Out
                </Button>
            </div>
        </div>

        {/* Verification/Status Banners */}
        {profile.status === 'pending_verification' && (
            <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-xl flex items-start gap-4 animate-slide-up shadow-sm">
                <div className="text-yellow-600 text-xl mt-1">
                    <i className="fas fa-clipboard-check"></i>
                </div>
                <div>
                    <h3 className="font-bold text-yellow-800 text-lg">Verification in Progress</h3>
                    <p className="text-yellow-700 mt-1">
                        Our team is currently reviewing your details. You will receive an update on your registered email soon.
                    </p>
                </div>
            </div>
        )}

        {profile.status === 'rejected' && (
            <div className="bg-orange-50 border border-orange-300 p-6 rounded-xl flex items-start gap-4 animate-slide-up shadow-sm">
                <div className="text-orange-600 text-xl mt-1">
                    <i className="fas fa-exclamation-circle"></i>
                </div>
                <div>
                    <h3 className="font-bold text-orange-800 text-lg">Profile Paused</h3>
                    <p className="text-orange-700 mt-1">
                        Your profile has been paused. Please contact admin for more details.
                    </p>
                </div>
            </div>
        )}

        {profile.status === 'approved' && (
            <div className="bg-green-50 border border-green-200 p-6 rounded-xl flex items-start gap-4 animate-slide-up shadow-sm">
                <div className="text-green-600 text-xl mt-1">
                    <i className="fas fa-check-circle"></i>
                </div>
                <div>
                    <h3 className="font-bold text-green-800 text-lg">Profile Approved</h3>
                    <p className="text-green-700 mt-1">
                        Your profile has been approved! You can now fully use the TheMindNetwork platform.
                    </p>
                </div>
            </div>
        )}

        {/* Edit Mode Save Bar */}
        {isEditing && (
            <div className="bg-teal-600 text-white p-4 rounded-xl flex justify-between items-center shadow-lg animate-slide-up">
                <span className="font-medium"><i className="fas fa-info-circle mr-2"></i> You are in edit mode. Some fields are locked.</span>
                <button onClick={handleSave} className="bg-white text-teal-600 px-6 py-2 rounded-lg font-bold hover:bg-teal-50 transition-colors">
                    Save Changes
                </button>
            </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            
            {/* Left Column: Details (Locked in Edit Mode) */}
            <div className="md:col-span-1 space-y-6">
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm relative overflow-hidden">
                    {isEditing && <div className="absolute top-0 right-0 bg-slate-100 text-slate-400 text-[10px] uppercase font-bold px-2 py-1 rounded-bl">Locked</div>}
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Contact Info</h3>
                    <ul className="space-y-4">
                        <li className="flex items-center gap-3 text-slate-700">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                                <i className="fas fa-envelope"></i>
                            </div>
                            <div className="overflow-hidden w-full">
                                <p className="text-xs text-slate-400">Email</p>
                                <p className="text-sm truncate font-medium" title={profile.basicInfo.email}>{profile.basicInfo.email}</p>
                            </div>
                        </li>
                        <li className="flex items-center gap-3 text-slate-700">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                                <i className="fas fa-phone"></i>
                            </div>
                            <div>
                                <p className="text-xs text-slate-400">Phone</p>
                                <p className="text-sm font-medium">{profile.basicInfo.phone}</p>
                            </div>
                        </li>
                         <li className="flex items-center gap-3 text-slate-700">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                                <i className="fas fa-map-marker-alt"></i>
                            </div>
                            <div>
                                <p className="text-xs text-slate-400">Location</p>
                                <p className="text-sm font-medium">{profile.basicInfo.location}</p>
                            </div>
                        </li>
                    </ul>
                </div>
            </div>

            {/* Right Column: Dynamic Content (Editable in Edit Mode) */}
            <div className="md:col-span-2 space-y-6">
                 <div className="bg-white border border-slate-200 p-6 rounded-2xl h-full shadow-sm">
                    <div className="flex justify-between items-start mb-6">
                         <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                             {isClient ? 'Clinical Summary' : 'Professional Profile'}
                         </h3>
                    </div>

                    {isClient && profile.clinical && (
                        <div className="text-slate-600">
                             {/* Client edit mode logic omitted for brevity as focus is on Provider in prompt, but structure allows it */}
                             <p className="italic">"{profile.clinical.presentingProblem}"</p>
                        </div>
                    )}

                    {isProvider && profile.providerDetails && editData.providerDetails && (
                        <div className="space-y-6">
                            {isEditing ? (
                                <>
                                    <div className="grid grid-cols-2 gap-4">
                                        <Input 
                                            label="Qualification" 
                                            value={editData.providerDetails.qualification}
                                            onChange={(e) => handleDetailChange('qualification', e.target.value)}
                                        />
                                        <Input 
                                            label="Years Experience" 
                                            value={editData.providerDetails.yearsExperience}
                                            onChange={(e) => handleDetailChange('yearsExperience', e.target.value)}
                                        />
                                    </div>
                                    <TextArea
                                        label="Specializations (comma separated)"
                                        value={editData.providerDetails.specializations.join(', ')}
                                        onChange={(e) => handleArrayChange('providerDetails', 'specializations', e.target.value)}
                                        className="h-20"
                                    />
                                    <Input 
                                        label="Languages Spoken (comma separated)" 
                                        value={editData.providerDetails.languages.join(', ')}
                                        onChange={(e) => handleArrayChange('providerDetails', 'languages', e.target.value)}
                                    />
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="flex flex-col gap-1.5 w-full">
                                            <label className="text-sm font-semibold text-slate-700 ml-1">Preferred Mode</label>
                                            <select
                                                value={editData.providerDetails.mode}
                                                onChange={(e) => handleDetailChange('mode', e.target.value)}
                                                className="bg-white border border-slate-300 text-slate-900 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-sm"
                                            >
                                                <option value="online">Online Only</option>
                                                <option value="offline">In-Person Only</option>
                                                <option value="both">Hybrid</option>
                                            </select>
                                        </div>
                                        <Input 
                                            label="Budget Range (INR)" 
                                            value={editData.providerDetails.budgetRange}
                                            onChange={(e) => handleDetailChange('budgetRange', e.target.value)}
                                        />
                                    </div>
                                    <Input 
                                        label="Therapeutic Focus" 
                                        value={editData.providerDetails.therapeuticFocus}
                                        onChange={(e) => handleDetailChange('therapeuticFocus', e.target.value)}
                                    />
                                    <Input 
                                        label="Licenses / Certifications" 
                                        value={editData.providerDetails.licenses}
                                        onChange={(e) => handleDetailChange('licenses', e.target.value)}
                                    />
                                    <Input 
                                        label="Website" 
                                        value={editData.providerDetails.website || ''}
                                        onChange={(e) => handleDetailChange('website', e.target.value)}
                                        placeholder="https://..."
                                    />
                                    
                                    {/* Resume Upload in Edit Mode */}
                                    <div className="flex flex-col gap-1.5 w-full">
                                        <label className="text-sm font-semibold text-slate-700 ml-1">
                                            Resume/CV Upload
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="file"
                                                accept=".pdf,.doc,.docx"
                                                onChange={handleResumeUpload}
                                                className="hidden"
                                                id="resume-edit-upload"
                                            />
                                            <label
                                                htmlFor="resume-edit-upload"
                                                className="flex items-center justify-between gap-2 bg-white border-2 border-dashed border-slate-300 text-slate-600 rounded-lg px-4 py-4 cursor-pointer hover:border-teal-400 hover:bg-teal-50 transition-all"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <i className="fas fa-cloud-upload-alt text-lg"></i>
                                                    <span className="font-medium text-sm">
                                                        {editData.providerDetails.resumeFileName || 'Click to upload PDF or DOC (max 5MB)'}
                                                    </span>
                                                </div>
                                                {editData.providerDetails.resumeFileName && (
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            setEditData({
                                                                ...editData,
                                                                providerDetails: {
                                                                    ...editData.providerDetails!,
                                                                    resumeFileData: '',
                                                                    resumeFileName: ''
                                                                }
                                                            });
                                                        }}
                                                        className="bg-red-100 text-red-600 rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-200"
                                                    >
                                                        <i className="fas fa-times text-xs"></i>
                                                    </button>
                                                )}
                                            </label>
                                        </div>
                                        <span className="text-xs text-slate-500 ml-1">
                                            Accepted formats: PDF, DOC, DOCX (Maximum size: 5MB)
                                        </span>
                                    </div>
                                    
                                    <TextArea
                                        label="Therapy Style / Bio"
                                        value={editData.providerDetails.therapyStyle}
                                        onChange={(e) => handleDetailChange('therapyStyle', e.target.value)}
                                    />
                                </>
                            ) : (
                                <>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <h5 className="text-sm text-slate-400 mb-1">Qualification</h5>
                                            <p className="font-semibold text-slate-800">{profile.providerDetails.qualification}</p>
                                        </div>
                                        <div>
                                            <h5 className="text-sm text-slate-400 mb-1">Experience</h5>
                                            <p className="font-semibold text-slate-800">{profile.providerDetails.yearsExperience} Years</p>
                                        </div>
                                    </div>

                                    <div className="mb-6">
                                        <h5 className="text-sm text-slate-400 mb-2">Specializations</h5>
                                        <div className="flex flex-wrap gap-2">
                                            {profile.providerDetails.specializations.map((spec, idx) => (
                                                <span 
                                                    key={idx} 
                                                    className="px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-sm"
                                                >
                                                    {spec}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
                                        <h5 className="text-sm text-slate-400 mb-2">Practice Info</h5>
                                        <div className="grid grid-cols-2 gap-y-2 text-sm">
                                            <div className="text-slate-600">Mode: <span className="text-slate-900 font-medium capitalize">{profile.providerDetails.mode}</span></div>
                                            <div className="text-slate-600">Budget: <span className="text-slate-900 font-medium">{profile.providerDetails.budgetRange}</span></div>
                                            
                                            {profile.providerDetails.therapeuticFocus && (
                                                <div className="col-span-2 text-slate-600">Focus: <span className="text-slate-900 font-medium">{profile.providerDetails.therapeuticFocus}</span></div>
                                            )}
                                            
                                            {profile.providerDetails.languages && profile.providerDetails.languages.length > 0 && (
                                                <div className="col-span-2 text-slate-600">
                                                    Languages: <span className="text-slate-900 font-medium">{profile.providerDetails.languages.join(', ')}</span>
                                                </div>
                                            )}
                                            
                                            {profile.providerDetails.clientType && profile.providerDetails.clientType.length > 0 && (
                                                <div className="col-span-2">
                                                    <p className="text-slate-600 mb-1">Client Types:</p>
                                                    <div className="flex flex-wrap gap-1">
                                                        {profile.providerDetails.clientType.map((type, idx) => (
                                                            <span key={idx} className="px-2 py-0.5 bg-teal-50 text-teal-700 text-xs rounded-full">
                                                                {type}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            
                                            {profile.providerDetails.licenses && (
                                                <div className="col-span-2 text-slate-600">
                                                    Licenses: <span className="text-slate-900 font-medium">{profile.providerDetails.licenses}</span>
                                                </div>
                                            )}
                                            
                                            {/* Resume Download */}
                                            {profile.providerDetails.resumeFileName && (
                                                <div className="col-span-2 mt-2">
                                                    <button onClick={handleDownloadResume} className="text-teal-600 hover:underline flex items-center">
                                                        <i className="fas fa-file-pdf mr-1"></i> Download Resume ({profile.providerDetails.resumeFileName})
                                                    </button>
                                                </div>
                                            )}

                                            {profile.providerDetails.website && (() => {
                                                let url = profile.providerDetails.website;
                                                if (!url.startsWith('http://') && !url.startsWith('https://')) {
                                                    url = 'https://' + url;
                                                }
                                                return (
                                                    <div className="col-span-2 mt-2">
                                                        <a href={url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                                                            <i className="fas fa-link mr-1"></i> Visit Website
                                                        </a>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {!isEditing && (
                        <div className="mt-6 pt-6 border-t border-slate-100">
                             <h5 className="text-sm text-slate-400 mb-2">
                                {isClient ? 'Profile Summary' : 'Professional Bio'}
                             </h5>
                             <p className="text-slate-600 text-sm leading-relaxed border-l-4 border-teal-500 pl-4">
                                {profile.aiSummary || 'No bio added yet. Click Edit Profile to add one.'}
                             </p>
                        </div>
                    )}
                    
                    {isEditing && (
                        <div className="mt-6 pt-6 border-t border-slate-100">
                            <TextArea
                                label={isClient ? 'Profile Summary' : 'Professional Bio'}
                                placeholder={isClient 
                                    ? "Describe what you're looking for in therapy and your goals..."
                                    : "Write a professional bio about your practice, approach, and expertise..."
                                }
                                value={editData.aiSummary || ''}
                                onChange={(e) => setEditData({ ...editData, aiSummary: e.target.value })}
                                rows={6}
                            />
                        </div>
                    )}
                 </div>
            </div>
        </div>
      </div>

      {/* RAG Chatbot Integration */}
      <ChatBot profile={profile} />
    </div>
  );
};