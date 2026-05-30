class YearConfig {
  final String id;
  final String masterKey;
  final String labelGu;
  final String labelEn;

  const YearConfig({
    required this.id,
    required this.masterKey,
    required this.labelGu,
    required this.labelEn,
  });
}

const List<YearConfig> FINANCIAL_YEARS = [
  YearConfig(id: 'year2023_24', masterKey: 'year23_24', labelGu: 'વર્ષ ૨૦૨૩/૨૪', labelEn: '2023/24'),
  YearConfig(id: 'year2024_25', masterKey: 'year24_25', labelGu: 'વર્ષ ૨૦૨૪/૨૫', labelEn: '2024/25'),
  YearConfig(id: 'year2025_26', masterKey: 'year25_26', labelGu: 'વર્ષ ૨૦૨૫/૨૬', labelEn: '2025/26'),
  YearConfig(id: 'year2026_27', masterKey: 'year26_27', labelGu: 'વર્ષ ૨૦૨૬/૨૭', labelEn: '2026/27'),
  YearConfig(id: 'year2027_28', masterKey: 'year27_28', labelGu: 'વર્ષ ૨૦૨૭/૨૮', labelEn: '2027/28'),
  YearConfig(id: 'year2028_29', masterKey: 'year28_29', labelGu: 'વર્ષ ૨૦૨૮/૨૯', labelEn: '2028/29'),
  YearConfig(id: 'year2029_30', masterKey: 'year29_30', labelGu: 'વર્ષ ૨૦૨૯/૩૦', labelEn: '2029/30'),
  YearConfig(id: 'year2030_31', masterKey: 'year30_31', labelGu: 'વર્ષ ૨૦૩૦/૩૧', labelEn: '2030/31'),
  YearConfig(id: 'year2031_32', masterKey: 'year31_32', labelGu: 'વર્ષ ૨૦૩૧/૩૨', labelEn: '2031/32'),
  YearConfig(id: 'year2032_33', masterKey: 'year32_33', labelGu: 'વર્ષ ૨૦૩૨/૩૩', labelEn: '2032/33'),
  YearConfig(id: 'year2033_34', masterKey: 'year33_34', labelGu: 'વર્ષ ૨૦૩૩/૩૪', labelEn: '2033/34'),
  YearConfig(id: 'year2034_35', masterKey: 'year34_35', labelGu: 'વર્ષ ૨૦૩૪/૩૫', labelEn: '2034/35'),
  YearConfig(id: 'year2035_36', masterKey: 'year35_36', labelGu: 'વર્ષ ૨૦૩૫/૩૬', labelEn: '2035/36'),
];
