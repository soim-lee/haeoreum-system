import { useState, useEffect } from "react";

export function useAccessKey() {
  const [hasAccess, setHasAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 로컬 스토리지에서 액세스 상태 확인
    const accessGranted = localStorage.getItem('techcorp_access') === 'granted';
    setHasAccess(accessGranted);
    setIsLoading(false);
  }, []);

  const grantAccess = () => {
    localStorage.setItem('techcorp_access', 'granted');
    setHasAccess(true);
  };

  const revokeAccess = () => {
    localStorage.removeItem('techcorp_access');
    setHasAccess(false);
  };

  return {
    hasAccess,
    isLoading,
    grantAccess,
    revokeAccess,
  };
}