/**
 * Calculation Engine for MitraM
 * Auto-computes financial values across members and years
 */

/**
 * Calculate vadheliRakam (remaining amount) for a member's yearly data
 * વધેલ રકમ = મુડી - ખર્ચ (Remaining = Investment - Expense)
 */
function calculateVadheliRakam(mudi, kharcha) {
  return (mudi || 0) - (kharcha || 0);
}

/**
 * Calculate ekandKul (grand total share) for a member's yearly data
 * એકંદર કુલ = વધેલ રકમ + નફો + હોલ્ડિંગ + ગોપી મંડળ
 */
function calculateEkandKul(vadheliRakam, nafoo, holding, gopiMandal) {
  // Holding is an amount reserved/withheld, so it should reduce distributable share.
  // Match frontend logic: grand total = remaining + profit - holding + gopiMandal
  return (vadheliRakam || 0) + (nafoo || 0) - (holding || 0) + (gopiMandal || 0);
}

/**
 * Recalculate all derived fields for a single yearly entry
 */
function recalculateYearlyEntry(entry) {
  entry.vadheliRakam = calculateVadheliRakam(entry.mudi, entry.kharcha);
  entry.ekandKul = calculateEkandKul(entry.vadheliRakam, entry.nafoo, entry.holding, entry.gopiMandal);
  return entry;
}

/**
 * Recalculate all derived fields for a member
 */
function recalculateMember(member) {
  if (member.yearlyData) {
    member.yearlyData = member.yearlyData.map(recalculateYearlyEntry);
  }
  return member;
}

/**
 * Calculate cross-year totals for a member
 */
function calculateMemberTotals(yearlyData) {
  const totals = {
    totalMudi: 0,
    totalKharcha: 0,
    totalVadheliRakam: 0,
    totalNafoo: 0,
    totalHolding: 0,
    totalGopiMandal: 0,
    totalEkandKul: 0
  };

  if (yearlyData && yearlyData.length > 0) {
    yearlyData.forEach(yd => {
      totals.totalMudi += yd.mudi || 0;
      totals.totalKharcha += yd.kharcha || 0;
      totals.totalVadheliRakam += yd.vadheliRakam || 0;
      totals.totalNafoo += yd.nafoo || 0;
      totals.totalHolding += yd.holding || 0;
      totals.totalGopiMandal += yd.gopiMandal || 0;
      totals.totalEkandKul += yd.ekandKul || 0;
    });
  }

  return totals;
}

/**
 * Calculate master summary from all members
 */
function calculateMasterSummary(members, years) {
  const summary = {};

  years.forEach(year => {
    summary[year] = {
      aavak: 0,
      bakiKharcha: 0,
      vadheliRakam: 0,
      nafoo: 0,
      holding: 0,
      gopiMandal: 0,
      ekandKul: 0
    };

    members.forEach(member => {
      const yearData = member.yearlyData?.find(yd => yd.year === year);
      if (yearData) {
        summary[year].aavak += yearData.mudi || 0;
        summary[year].bakiKharcha += yearData.kharcha || 0;
        summary[year].vadheliRakam += yearData.vadheliRakam || 0;
        summary[year].nafoo += yearData.nafoo || 0;
        summary[year].holding += yearData.holding || 0;
        summary[year].gopiMandal += yearData.gopiMandal || 0;
        summary[year].ekandKul += yearData.ekandKul || 0;
      }
    });
  });

  return summary;
}

module.exports = {
  calculateVadheliRakam,
  calculateEkandKul,
  recalculateYearlyEntry,
  recalculateMember,
  calculateMemberTotals,
  calculateMasterSummary
};
