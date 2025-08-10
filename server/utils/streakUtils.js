const calculateStreakBonus = (streak) => {
  if (streak >= 1 && streak < 5) {
    return 1;
  } else if (streak >= 5 && streak < 10) {
    return 2;
  } else if (streak >= 10 && streak < 15) {
    return 3;
  } else if (streak >= 15 && streak < 20) {
    return 4;
  } else if (streak >= 20 && streak < 25) {
    return 5;
  } else if (streak >= 25) {
    return 6;
  }
  return 0;
};

const isSameDay = (date1, date2) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
};

const isConsecutiveDay = (lastDate, currentDate) => {
  const last = new Date(lastDate);
  const current = new Date(currentDate);
  const diffTime = Math.abs(current - last);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays === 1;
};

const updateLoginStreak = (user) => {
  const today = new Date();
  const lastLogin = user.lastLoginDate ? new Date(user.lastLoginDate) : null;
  
  // If no last login or different day
  if (!lastLogin || !isSameDay(lastLogin, today)) {
    // If it's a consecutive day, increment streak
    if (lastLogin && isConsecutiveDay(lastLogin, today)) {
      user.loginStreak += 1;
    } else {
      // Reset streak if not consecutive
      user.loginStreak = 1;
    }
    user.lastLoginDate = today;
  }
  
  return user;
};

const updateTestCompletionStreak = (user) => {
  const today = new Date();
  const lastTestDate = user.lastTestCompletionDate ? new Date(user.lastTestCompletionDate) : null;
  
  // If this is the first test completion of the day
  if (!lastTestDate || !isSameDay(lastTestDate, today)) {
    // If it's a consecutive day, increment streak
    if (lastTestDate && isConsecutiveDay(lastTestDate, today)) {
      user.loginStreak += 1;
    } else if (!lastTestDate || !isSameDay(lastTestDate, today)) {
      // If no test completed today yet, start or continue streak
      if (user.loginStreak === 0) {
        user.loginStreak = 1;
      } else if (lastTestDate && !isConsecutiveDay(lastTestDate, today)) {
        // Reset streak if not consecutive
        user.loginStreak = 1;
      }
    }
    user.lastTestCompletionDate = today;
  }
  
  return user;
};

const checkAndResetStreakIfNoCoins = async (user) => {
  const today = new Date();
  const lastCoinEarned = user.lastCoinEarnedDate ? new Date(user.lastCoinEarnedDate) : null;
  
  // If user hasn't earned coins today and it's a new day, reset streak
  if (lastCoinEarned && !isSameDay(lastCoinEarned, today)) {
    user.loginStreak = 0;
    user.streakBonusUsedToday = false;
    await user.save();
    return true; // Streak was reset
  }
  
  // Also reset streakBonusUsedToday flag if it's a new day
  if (user.streakBonusUsedToday && lastCoinEarned && !isSameDay(lastCoinEarned, today)) {
    user.streakBonusUsedToday = false;
    await user.save();
  }
  
  return false; // Streak was not reset
};

module.exports = {
  calculateStreakBonus,
  isSameDay,
  isConsecutiveDay,
  updateLoginStreak,
  updateTestCompletionStreak,
  checkAndResetStreakIfNoCoins
};
