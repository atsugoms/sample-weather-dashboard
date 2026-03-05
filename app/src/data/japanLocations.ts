export interface Municipality {
  name: string;
  lat: number;
  lon: number;
}

export interface Prefecture {
  name: string;
  municipalities: Municipality[];
}

export const japanLocations: Prefecture[] = [
  { name: '北海道', municipalities: [{ name: '札幌市', lat: 43.0642, lon: 141.3469 }] },
  { name: '青森県', municipalities: [{ name: '青森市', lat: 40.8246, lon: 140.7404 }] },
  { name: '岩手県', municipalities: [{ name: '盛岡市', lat: 39.7036, lon: 141.1527 }] },
  { name: '宮城県', municipalities: [{ name: '仙台市', lat: 38.2682, lon: 140.8694 }] },
  { name: '秋田県', municipalities: [{ name: '秋田市', lat: 39.7186, lon: 140.1023 }] },
  { name: '山形県', municipalities: [{ name: '山形市', lat: 38.2404, lon: 140.3634 }] },
  { name: '福島県', municipalities: [{ name: '福島市', lat: 37.7608, lon: 140.4748 }] },
  { name: '茨城県', municipalities: [{ name: '水戸市', lat: 36.3418, lon: 140.4468 }] },
  { name: '栃木県', municipalities: [{ name: '宇都宮市', lat: 36.5657, lon: 139.8836 }] },
  { name: '群馬県', municipalities: [{ name: '前橋市', lat: 36.3906, lon: 139.0608 }] },
  { name: '埼玉県', municipalities: [{ name: 'さいたま市', lat: 35.8617, lon: 139.6455 }] },
  { name: '千葉県', municipalities: [{ name: '千葉市', lat: 35.6073, lon: 140.1063 }] },
  { name: '東京都', municipalities: [{ name: '東京', lat: 35.6762, lon: 139.6503 }] },
  { name: '神奈川県', municipalities: [{ name: '横浜市', lat: 35.4437, lon: 139.6380 }] },
  { name: '新潟県', municipalities: [{ name: '新潟市', lat: 37.9026, lon: 139.0232 }] },
  { name: '富山県', municipalities: [{ name: '富山市', lat: 36.6959, lon: 137.2137 }] },
  { name: '石川県', municipalities: [{ name: '金沢市', lat: 36.5613, lon: 136.6562 }] },
  { name: '福井県', municipalities: [{ name: '福井市', lat: 36.0652, lon: 136.2216 }] },
  { name: '山梨県', municipalities: [{ name: '甲府市', lat: 35.6635, lon: 138.5685 }] },
  { name: '長野県', municipalities: [{ name: '長野市', lat: 36.6486, lon: 138.1947 }] },
  { name: '岐阜県', municipalities: [{ name: '岐阜市', lat: 35.4232, lon: 136.7608 }] },
  { name: '静岡県', municipalities: [{ name: '静岡市', lat: 34.9769, lon: 138.3831 }] },
  { name: '愛知県', municipalities: [{ name: '名古屋市', lat: 35.1815, lon: 136.9066 }] },
  { name: '三重県', municipalities: [{ name: '津市', lat: 34.7303, lon: 136.5086 }] },
  { name: '滋賀県', municipalities: [{ name: '大津市', lat: 35.0045, lon: 135.8686 }] },
  { name: '京都府', municipalities: [{ name: '京都市', lat: 35.0116, lon: 135.7681 }] },
  { name: '大阪府', municipalities: [{ name: '大阪市', lat: 34.6937, lon: 135.5023 }] },
  { name: '兵庫県', municipalities: [{ name: '神戸市', lat: 34.6913, lon: 135.1830 }] },
  { name: '奈良県', municipalities: [{ name: '奈良市', lat: 34.6851, lon: 135.8050 }] },
  { name: '和歌山県', municipalities: [{ name: '和歌山市', lat: 34.2261, lon: 135.1675 }] },
  { name: '鳥取県', municipalities: [{ name: '鳥取市', lat: 35.5011, lon: 134.2351 }] },
  { name: '島根県', municipalities: [{ name: '松江市', lat: 35.4723, lon: 133.0505 }] },
  { name: '岡山県', municipalities: [{ name: '岡山市', lat: 34.6617, lon: 133.9344 }] },
  { name: '広島県', municipalities: [{ name: '広島市', lat: 34.3853, lon: 132.4553 }] },
  { name: '山口県', municipalities: [{ name: '山口市', lat: 34.1861, lon: 131.4705 }] },
  { name: '徳島県', municipalities: [{ name: '徳島市', lat: 34.0658, lon: 134.5593 }] },
  { name: '香川県', municipalities: [{ name: '高松市', lat: 34.3401, lon: 134.0434 }] },
  { name: '愛媛県', municipalities: [{ name: '松山市', lat: 33.8395, lon: 132.7654 }] },
  { name: '高知県', municipalities: [{ name: '高知市', lat: 33.5597, lon: 133.5311 }] },
  { name: '福岡県', municipalities: [{ name: '福岡市', lat: 33.5904, lon: 130.4017 }] },
  { name: '佐賀県', municipalities: [{ name: '佐賀市', lat: 33.2635, lon: 130.3008 }] },
  { name: '長崎県', municipalities: [{ name: '長崎市', lat: 32.7448, lon: 129.8737 }] },
  { name: '熊本県', municipalities: [{ name: '熊本市', lat: 32.7898, lon: 130.7417 }] },
  { name: '大分県', municipalities: [{ name: '大分市', lat: 33.2382, lon: 131.6126 }] },
  { name: '宮崎県', municipalities: [{ name: '宮崎市', lat: 31.9111, lon: 131.4239 }] },
  { name: '鹿児島県', municipalities: [{ name: '鹿児島市', lat: 31.5602, lon: 130.5581 }] },
  { name: '沖縄県', municipalities: [{ name: '那覇市', lat: 26.2124, lon: 127.6809 }] },
];
