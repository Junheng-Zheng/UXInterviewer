'use client';
import Link from 'next/link';
import { House, User, SquareArrowOutUpRight, Save, Mail, Lock, MapPin } from 'lucide-react';
import { CreditCard } from 'lucide-react';
import { LogOut } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { BookUser } from 'lucide-react';
const Page= () => {

  const [activeTab, setActiveTab] = useState('account');
  const [userData, setUserData] = useState({
    firstName: '',
    lastName: '',
    email: '',
  });
  const [loading, setLoading] = useState(true);
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [subscriptionError, setSubscriptionError] = useState(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState(null);
  const [showVerifyEmailModal, setShowVerifyEmailModal] = useState(false);
  const [verifyCode, setVerifyCode] = useState(Array(6).fill(''));
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const [emailSuccessMessage, setEmailSuccessMessage] = useState(null);
  const verifyInputsRef = useRef(Array(6).fill(null));
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState(null);
  const [managePortalLoading, setManagePortalLoading] = useState(false);
  const [managePortalError, setManagePortalError] = useState(null);
  const [identityProvider, setIdentityProvider] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch('/api/user/profile');
        if (response.ok) {
          const data = await response.json();
          setUserData({
            firstName: data.givenName || '',
            lastName: data.familyName || '',
            email: data.email || '',
          });
          setIdentityProvider(data.identityProvider ?? null);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    const fetchSubscriptionData = async () => {
      if (activeTab === 'subscriptions') {
        setSubscriptionLoading(true);
        setSubscriptionError(null);
        try {
          const response = await fetch('/api/stripe/subscription');
          if (response.ok) {
            const data = await response.json();
            setSubscriptionData(data);
          } else {
            const error = await response.json();
            setSubscriptionError(error.error || 'Failed to fetch subscription data');
          }
        } catch (error) {
          console.error('Error fetching subscription data:', error);
          setSubscriptionError('Failed to fetch subscription data');
        } finally {
          setSubscriptionLoading(false);
        }
      }
    };

    fetchSubscriptionData();
  }, [activeTab]);

  useEffect(() => {
    if (!emailSuccessMessage) return;
    const t = setTimeout(() => setEmailSuccessMessage(null), 5000);
    return () => clearTimeout(t);
  }, [emailSuccessMessage]);

  useEffect(() => {
    if (!passwordMessage || !passwordMessage.startsWith('Password updated')) return;
    const t = setTimeout(() => setPasswordMessage(null), 5000);
    return () => clearTimeout(t);
  }, [passwordMessage]);

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  // Format currency helper
  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const handleSaveProfile = async () => {
    setProfileMessage(null);
    setEmailSuccessMessage(null);
    setProfileSaving(true);
    try {
      const body = {};
      if (userData.firstName?.trim()) body.firstName = userData.firstName.trim();
      if (userData.lastName?.trim()) body.lastName = userData.lastName.trim();
      if (userData.email?.trim() && identityProvider !== 'Google') body.email = userData.email.trim();
      if (Object.keys(body).length === 0) {
        setProfileMessage('No changes to save');
        return;
      }
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save profile');
      }
      if (data.profile) {
        setUserData((prev) => ({
          firstName: data.profile.givenName ?? prev.firstName,
          lastName: data.profile.familyName ?? prev.lastName,
          email: data.profile.email ?? prev.email,
        }));
      }
      if (data.emailVerificationRequired) {
        setShowVerifyEmailModal(true);
        setVerifyCode(Array(6).fill(''));
        setVerifyError('');
      } else {
        setProfileMessage('Profile saved.');
        const refetchRes = await fetch('/api/user/profile');
        if (refetchRes.ok) {
          const refetchData = await refetchRes.json();
          setUserData({
            firstName: refetchData.givenName ?? '',
            lastName: refetchData.familyName ?? '',
            email: refetchData.email ?? '',
          });
          setIdentityProvider(refetchData.identityProvider ?? null);
        }
      }
    } catch (error) {
      setProfileMessage(error.message || 'Failed to save profile');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleSavePassword = async () => {
    setPasswordMessage(null);
    if (!currentPassword.trim()) {
      setPasswordMessage('Current password is required');
      return;
    }
    if (!newPassword.trim()) {
      setPasswordMessage('New password is required');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordMessage('New password and confirmation do not match');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordMessage('Password must be at least 8 characters');
      return;
    }
    if (!/[A-Z]/.test(newPassword)) {
      setPasswordMessage('Password must include one uppercase letter');
      return;
    }
    if (!/[a-z]/.test(newPassword)) {
      setPasswordMessage('Password must include one lowercase letter');
      return;
    }
    if (!/[0-9]/.test(newPassword)) {
      setPasswordMessage('Password must include one number');
      return;
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
      setPasswordMessage('Password must include one special character');
      return;
    }
    setPasswordSaving(true);
    try {
      const response = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: currentPassword.trim(),
          newPassword: newPassword.trim(),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to change password');
      }
      setPasswordMessage('Password updated.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (error) {
      setPasswordMessage(error.message || 'Failed to change password');
    } finally {
      setPasswordSaving(false);
    }
  };

  const isVerifyCodeComplete = verifyCode.every((d) => d !== '');
  const handleVerifyCodeChange = (value, index) => {
    if (!/^\d?$/.test(value)) return;
    const newCode = [...verifyCode];
    newCode[index] = value;
    setVerifyCode(newCode);
    if (value && index < 5) verifyInputsRef.current[index + 1]?.focus();
  };
  const handleVerifyKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !verifyCode[index] && index > 0) {
      verifyInputsRef.current[index - 1]?.focus();
    }
  };
  const handleVerifyPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const newCode = pasted.split('');
    setVerifyCode([...newCode, ...Array(6 - newCode.length).fill('')]);
    verifyInputsRef.current[Math.min(pasted.length - 1, 5)]?.focus();
  };
  const handleManageBilling = async () => {
    setManagePortalError(null);
    setManagePortalLoading(true);
    try {
      const response = await fetch('/api/stripe/billing-portal', { method: 'POST' });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to open billing portal');
      }
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      throw new Error('No portal URL returned');
    } catch (err) {
      setManagePortalError(err.message || 'Failed to open billing portal');
    } finally {
      setManagePortalLoading(false);
    }
  };

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    setVerifyError('');
    if (!isVerifyCodeComplete) {
      setVerifyError('Enter the 6-digit code');
      return;
    }
    setVerifyLoading(true);
    try {
      const response = await fetch('/api/user/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: verifyCode.join('') }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Verification failed');
      }
      setEmailSuccessMessage('Email successfully updated');
      setShowVerifyEmailModal(false);
      setVerifyCode(Array(6).fill(''));
      const refetchRes = await fetch('/api/user/profile');
      if (refetchRes.ok) {
        const refetchData = await refetchRes.json();
        setUserData({
          firstName: refetchData.givenName ?? '',
          lastName: refetchData.familyName ?? '',
          email: refetchData.email ?? '',
        });
        setIdentityProvider(refetchData.identityProvider ?? null);
      }
    } catch (err) {
      setVerifyError(err.message || 'Verification failed');
    } finally {
      setVerifyLoading(false);
    }
  };

  return (
    <div className = "flex flex-col text-sm  h-screen gap-0">
              {/* <Link
          href="/"
          className="inline-flex px-12 border-b border-gray-200 w-full bg-gray-100 py-6 items-center gap-2 text-gray-600 hover:text-gray-900  transition-colors duration-200"
        >
          <House size={20} strokeWidth={1.3} /> Back
        </Link> */}


      <div className = "flex w-full h-full flex-1  bg-gray-200">
      <div className = "relative flex flex-col  top-0 border-r border-gray-200 justify-center  bg-gray-50 w-fit px-8 gap-2 ">
        <Link
          href="/"
          className="inline-flex absolute top-0 left-0 px-8 border-b border-gray-200 w-full  py-6 items-center gap-2 text-gray-600 hover:text-gray-900  transition-colors duration-200"
        >
          <House size={20} strokeWidth={1.3} /> Back
        </Link>
        <div className = {`flex cursor-pointer px-4 py-3 items-center gap-2 rounded-xl ${activeTab === 'account' ? ' bg-blue-100 ' : 'bg-white'}`} onClick={() => setActiveTab('account')}>
          <User size={20} strokeWidth={1.3} />
          Account 
        </div>
        <div className = {`flex cursor-pointer px-4 py-3 items-center gap-2 rounded-xl ${activeTab === 'subscriptions' ? ' bg-blue-100 ' : 'bg-white'}`} onClick={() => setActiveTab('subscriptions')}>
          <CreditCard size={20} strokeWidth={1.3} />
          Subscriptions
        </div>
        {/* <div className = {`flex cursor-pointer px-4 py-3 items-center gap-2 ${activeTab === 'signout' ? ' bg-white rounded-xl' : ''}`} >
          <LogOut size={20} strokeWidth={1.3} />
          Sign Out
        </div> */}
      </div>
      <div className = " bg-gray-100 p-8 relative flex-1 h-full flex w-full">
<div
        className="absolute top-0 left-0   inset-0 z-2 bg-[radial-gradient(circle,rgba(156,163,175,0.2)_1px,transparent_1px)] pointer-events-none"
        style={{ backgroundSize: '16px 16px' }}>
      </div>
        {/* overflow container */}
        {activeTab === 'account' && 
        <div className = "w-full flex-1 overflow-y-auto relative flex flex-col  scrollbar-hide bg-white rounded-xl  ">

          <div className = "w-full p-9  px-24 border-b border-gray-200 ">
          
           <div className = "w-full z-20 h-[240px] relative rounded-lg  overflow-hidden">
            <Image src="/talking.png" alt="profile" fill className = "w-full h-full object-cover object-center brightness-70" />
            <p className = "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white text-3xl font-serif">Account Information</p>
           </div>
          </div>

            <div className = "w-full flex flex-col  border-b border-gray-200">
             <div className = " flex flex-col gap-8 p-8 px-24">
                 <h3 className = "text-2xl font-serif">Profile</h3>
              <div className = "flex gap-2 items-center">
                <div className = "w-64 text-gray-600 flex items-center gap-2"> <BookUser size={16} strokeWidth={1.3} className="text-gray-600" /> Name</div>
                <div className = "flex items-center gap-2 w-full">
                  <div className = "flex gap-2 w-full flex-col">
                    <p className = "text-sm text-gray-600">First Name</p>
                    <input type="text" value={userData.firstName || ""} onChange={(e) => setUserData((prev) => ({ ...prev, firstName: e.target.value }))} placeholder="John" className = "w-full bg-white rounded-xl border border-gray-200 px-4 py-3" />
                  </div>
                  <div className = "flex gap-2 w-full flex-col">
                    <p className = "text-sm text-gray-600">Last Name</p>
                    <input type="text" value={userData.lastName || ""} onChange={(e) => setUserData((prev) => ({ ...prev, lastName: e.target.value }))} placeholder="Doe" className = "w-full bg-white rounded-xl border border-gray-200 px-4 py-3" />
                  </div>
                </div>
              
              </div>
                <div className = "flex gap-2 items-center">
                <div className = "w-64 text-gray-600 flex items-center gap-2"> <Mail size={16} strokeWidth={1.3} className="text-gray-600" /> Email</div>
                <div className = "flex flex-col gap-1 w-full">
                  {identityProvider === 'Google' && (
                    <p className="text-sm text-gray-500 mb-1">Linked with Google</p>
                  )}
                  <input
                    type="email"
                    value={userData.email || ""}
                    onChange={(e) => setUserData((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder="email@example.com"
                    readOnly={identityProvider === 'Google'}
                    className = {`w-full rounded-xl border border-gray-200 px-4 py-3 ${identityProvider === 'Google' ? 'bg-gray-100 text-gray-600 cursor-not-allowed' : 'bg-white'}`}
                  />
                  {emailSuccessMessage && <p className="text-green-600 text-sm">{emailSuccessMessage}</p>}
                </div>
              </div>
            <div className = "w-full flex justify-end items-center gap-3">
              {profileMessage && <p className={profileMessage.startsWith('Profile saved') ? 'text-green-600 text-sm' : 'text-red-600 text-sm'}>{profileMessage}</p>}
              <button type="button" onClick={handleSaveProfile} disabled={profileSaving} className="px-4 py-3 w-fit bg-gray-100 text-gray-600 rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"> <Save size={16} strokeWidth={1.3} className="text-gray-600" /> {profileSaving ? 'Saving...' : 'Save Profile Changes'}</button>
            </div>
            </div>
           </div>
            
             <div className = " flex flex-col px-24 gap-8 p-8">
               <h3 className = "text-2xl font-serif">Security</h3>
              <div className = "flex  gap-2 items-start">
                <div className = "w-64 text-gray-600 flex items-center gap-2"> <Lock size={16} strokeWidth={1.3} className="text-gray-600" /> Password</div>
                <div className = "flex flex-col items-center gap-8 w-full">
                  <div className = "flex gap-2  w-full flex-col">
                    <p className = "text-sm text-gray-600">Current Password</p>
                    <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="••••••••" className = "w-full bg-white rounded-xl border border-gray-200 px-4 py-3" />
                  </div>

                       <div className = "flex items-center gap-2 w-full">
                  <div className = "flex gap-2 w-full flex-col">
                    <p className = "text-sm text-gray-600">New Password</p>
                    <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" className = "w-full bg-white rounded-xl border border-gray-200 px-4 py-3" />
                  </div>
                  <div className = "flex gap-2 w-full flex-col">
                    <p className = "text-sm text-gray-600">Confirm New Password</p>
                    <input type="password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} placeholder="••••••••" className = "w-full bg-white rounded-xl border border-gray-200 px-4 py-3" />
                  </div>
                </div>

                </div>
              </div>
              <div className = "w-full flex justify-end items-center gap-3">
                {passwordMessage && <p className={passwordMessage.startsWith('Password updated') ? 'text-green-600 text-sm' : 'text-red-600 text-sm'}>{passwordMessage}</p>}
               <button type="button" onClick={handleSavePassword} disabled={passwordSaving} className="px-4 py-3 w-fit bg-gray-100 text-gray-600 rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"> <Save size={16} strokeWidth={1.3} className="text-gray-600" /> {passwordSaving ? 'Saving...' : 'Save Security Changes'}</button>
               </div>
            </div>
         
         

        </div>}
        
        {activeTab === 'subscriptions' && 
        <div className = "w-full flex-1 overflow-y-auto relative flex flex-col  scrollbar-hide bg-white rounded-xl  ">

          <div className = "w-full p-9  px-24 border-b border-gray-200 ">
          
           <div className = "w-full z-20 h-[240px] relative rounded-lg  overflow-hidden">
            <Image src="/talking.png" alt="profile" fill className = "w-full h-full object-cover object-center brightness-70" />
            <p className = "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white text-3xl font-serif">Subscriptions</p>
           </div>
          </div>

            <div className = "w-full border-b border-gray-200">
             <div className = "flex flex-col gap-8 p-8 px-24">
                 <h3 className = "text-2xl font-serif">Customer & Billing Overview</h3>

                 {subscriptionLoading ? (
                  <div className="flex justify-center items-center p-6 rounded-xl bg-gray-100">
                    <p className="text-gray-600">Loading subscription data...</p>
                  </div>
                ) : subscriptionError ? (
                  <div className="flex justify-center items-center p-6 rounded-xl bg-gray-100">
                    <p className="text-red-600">{subscriptionError}</p>
                  </div>
                ) : subscriptionData?.hasSubscription && subscriptionData?.subscription ? (
                  <div className="flex justify-between items-center p-6 rounded-xl bg-gray-100 ">
                    <div className="flex flex-col gap-2">
                      <p className="text-sm text-gray-600">Current Plan</p>
                      <div className="flex items-center gap-2">
                        <p className="text-xl font-serif px-3 py-2 rounded-xl bg-pink-100">
                          {subscriptionData.subscription.planName}
                        </p>
                        <span>— {formatCurrency(subscriptionData.subscription.amount, subscriptionData.subscription.currency)} / {subscriptionData.subscription.interval}</span>
                      </div>
                    </div>
                    <button type="button" onClick={handleManageBilling} disabled={managePortalLoading} className="px-4 py-2 border border-gray-200 bg-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed">{managePortalLoading ? 'Opening…' : 'Manage'}</button>
                  </div>
                ) : (
                  <div className="flex justify-between items-center p-6 rounded-xl bg-gray-100 ">
                    <div className="flex flex-col gap-2">
                      <p className="text-sm text-gray-600">Current Plan</p>
                      <p className="text-xl font-serif">No active subscription</p>
                    </div>
                    <Link href="/plans" className="px-4 py-2 border border-gray-200 bg-white rounded-lg ">Subscribe</Link>
                  </div>
                )}


              {managePortalError && (
                  <p className="text-red-600 text-sm">{managePortalError}</p>
                )}
              <div className = "flex gap-2 items-center">
                <div className = "w-64 text-gray-600 flex items-center gap-2"> <BookUser size={16} strokeWidth={1.3} className="text-gray-600" /> Customer Name</div>
                <div className = "flex items-center gap-2 w-full">
                  <p className="text-gray-900">{subscriptionData?.customer?.name || '—'}</p>
                </div>
              </div>
                <div className = "flex gap-2 items-start">
                <div className = "w-64 text-gray-600 flex items-center gap-2"> <MapPin size={16} strokeWidth={1.3} className="text-gray-600" /> Billing Address</div>
                <div className = "flex flex-col gap-1 w-full">
                  {subscriptionData?.customer?.address && (subscriptionData.customer.address.line1 || subscriptionData.customer.address.city || subscriptionData.customer.address.country) ? (
                    <p className="text-gray-900">
                      {[subscriptionData.customer.address.line1, subscriptionData.customer.address.line2].filter(Boolean).join(', ')}
                      {subscriptionData.customer.address.line1 || subscriptionData.customer.address.line2 ? ' — ' : ''}
                      {[subscriptionData.customer.address.city, subscriptionData.customer.address.state, subscriptionData.customer.address.postal_code].filter(Boolean).join(', ')}
                      {subscriptionData.customer.address.country ? ` ${subscriptionData.customer.address.country}` : ''}
                    </p>
                  ) : (
                    <p className="text-gray-500">No address on file</p>
                  )}
                </div>
              </div>
                 {subscriptionData?.paymentMethod ? (
                  <div className="flex flex-col gap-2 p-6 rounded-xl bg-gray-100 ">
                    <p className="text-sm text-gray-600">Payment Method</p>
                    <p className="text-xl font-serif">{subscriptionData.paymentMethod.displayText}</p>
                    <p className="text-sm text-gray-500">Update payment method in Stripe via Manage above.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 p-6 rounded-xl bg-gray-100 ">
                    <p className="text-sm text-gray-600">Payment Method</p>
                    <p className="text-xl font-serif text-gray-500">No payment method on file</p>
                    <p className="text-sm text-gray-500">Add or update payment method in Stripe via Manage above.</p>
                  </div>
                )}

               

            </div>
           </div>
            
             <div className = "flex flex-col gap-8 px-24 p-8">

              <div className = "w-full">
                <h3 className = "text-2xl font-serif">Billing Invoices</h3>
              </div>

                        <div className = "w-full flex flex-col border border-gray-100 rounded-xl">
                              {/* invoices header */}
             <div className = "w-full flex-1 flex items-center px-4 py-3 bg-gray-100">
              <div className = "w-full justify-center flex-1 flex items-center"> <p>Date</p></div>
              <div className = "w-full justify-center flex-1 flex items-center"> <p>Invoice</p></div>
              <div className = "w-full justify-center flex-1 flex items-center"> <p>Amount</p></div>
              <div className = "w-full justify-center flex-1 flex items-center"> <p>Status</p></div>
              <div className = "w-full justify-center items-center flex-1 flex "> <p>Actions</p></div>

              </div>

              {/* invoices body */}
              {subscriptionLoading ? (
                <div className="w-full text-gray-600 flex-1 flex items-center justify-center px-4 py-8">
                  <p>Loading invoices...</p>
                </div>
              ) : subscriptionData?.invoices && subscriptionData.invoices.length > 0 ? (
                subscriptionData.invoices.map((invoice, index, array) => (
                  <div key={invoice.id} className = {`w-full text-gray-600 flex-1 flex items-center px-4 py-3  border-b border-gray-200 ${index === array.length - 1 ? 'border-b-0' : ''}`}>
                    <div className = "w-full justify-center flex-1 flex items-center"> <p>{formatDate(invoice.date)}</p></div>
                    <div className = "w-full justify-center flex-1 flex items-center"> <p>{invoice.number || invoice.id}</p></div>
                    <div className = "w-full justify-center flex-1 flex items-center"> <p>{formatCurrency(invoice.amount, invoice.currency)}</p></div>
                    <div className = "w-full justify-center flex-1 flex items-center"> <p className={`capitalize ${invoice.status === 'paid' ? 'text-green-600' : invoice.status === 'open' ? 'text-yellow-600' : 'text-red-600'}`}>{invoice.status}</p></div>
                    <div className = "w-full justify-center items-center flex-1 flex gap-2 ">
                      {invoice.hostedInvoiceUrl || invoice.invoicePdf ? (
                        <a 
                          href={invoice.hostedInvoiceUrl || invoice.invoicePdf} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 hover:text-blue-600"
                        >
                          <p>View</p> 
                          <SquareArrowOutUpRight size={16} strokeWidth={2} className="text-gray-600" />
                        </a>
                      ) : (
                        <p>View</p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="w-full text-gray-600 flex-1 flex items-center justify-center px-4 py-8">
                  <p>No invoices found</p>
                </div>
              )}
              </div>

            </div>
         
         

        </div>}

        {showVerifyEmailModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" aria-modal="true">
            <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full mx-4 flex flex-col gap-6">
              <h3 className="text-2xl font-serif">Verify your new email</h3>
              <p className="text-gray-500 text-sm">
                We sent a 6-digit verification code to your new email address. Enter it below.
              </p>
              <form onSubmit={handleVerifySubmit} className="flex flex-col gap-4">
                {verifyError && (
                  <p className="text-red-600 text-sm">{verifyError}</p>
                )}
                <div className="flex gap-2 justify-between">
                  {verifyCode.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => (verifyInputsRef.current[index] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleVerifyCodeChange(e.target.value, index)}
                      onKeyDown={(e) => handleVerifyKeyDown(e, index)}
                      onPaste={index === 0 ? handleVerifyPaste : undefined}
                      className="w-full h-14 text-center text-xl border border-gray-200 rounded-xl focus:outline-none focus:border-gray-400"
                    />
                  ))}
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => { setShowVerifyEmailModal(false); setVerifyError(''); setVerifyCode(Array(6).fill('')); }}
                    className="px-4 py-2 text-gray-600 rounded-lg border border-gray-200 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={verifyLoading || !isVerifyCodeComplete}
                    className="px-4 py-2 bg-gray-900 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {verifyLoading ? 'Verifying...' : 'Verify'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        
      </div>
       
    </div>
    </div>
  );
};

export default Page;