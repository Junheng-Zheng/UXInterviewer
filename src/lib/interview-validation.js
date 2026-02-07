/**
 * Client-side utility for interview validation
 * This is a pure function that can be safely used in client components
 */

/**
 * Check if user can start a new interview based on their plan and interviews used
 * @param {string} plan - User's subscription plan ('free', 'pro', 'pro_yearly')
 * @param {number} interviewsUsed - Number of interviews the user has used
 * @returns {boolean} - True if user can start interview, false otherwise
 */
export function canStartInterview(plan, interviewsUsed) {
    // Paid plans can always start interviews
    if (plan !== 'free') {
        return true;
    }
    
    // Free plan users can only start if they've used less than 3 interviews
    return interviewsUsed < 3;
}
