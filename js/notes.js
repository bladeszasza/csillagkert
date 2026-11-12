// A Zenevár hangjai (adat, DOM nélkül: a sablonok, a feladatok és a Node-tesztek is ezt használják).
// Dó-alapú skála (dó = C5); semi: félhangnyi távolság a dótól. A név a szolmizációs név, ahogy a harangon áll.
// msz, mla: a mély szó és lá; fdo: a felső dó. Ezek nincsenek harangon, csak a hallás-összehasonlításban szólnak.
export const NOTES = {
  msz: { f: 392.0, semi: -5, name: 'szó', c: '#2fa3b8' },
  mla: { f: 440.0, semi: -3, name: 'lá', c: '#4a7dff' },
  do: { f: 523.25, semi: 0, name: 'dó', c: '#ff5d5d' },
  re: { f: 587.33, semi: 2, name: 'ré', c: '#ff9f43' },
  mi: { f: 659.25, semi: 4, name: 'mi', c: '#d99a00' },
  fa: { f: 698.46, semi: 5, name: 'fá', c: '#3fae7c' },
  szo: { f: 783.99, semi: 7, name: 'szó', c: '#2fa3b8' },
  la: { f: 880.0, semi: 9, name: 'lá', c: '#4a7dff' },
  ti: { f: 987.77, semi: 11, name: 'ti', c: '#9b5de5' },
  fdo: { f: 1046.5, semi: 12, name: 'dó', c: '#ff5d5d' },
};
// a három összehasonlító harang színe és neve (a képernyőn balról jobbra ebben a sorrendben szólnak)
export const TRIO = [{ k: 'rozsaszin', c: '#ff7ab8', name: 'rózsaszín' }, { k: 'kek', c: '#4a9dff', name: 'kék' }, { k: 'zold', c: '#3fbf6f', name: 'zöld' }];
// hangerő-fokozatok a közös hangmotoron (a kompresszor után mérve: a közepes kb. 4–5, a halk kb. 10 decibellel halkabb)
export const VOL = { hangos: 1, kozepes: 0.45, halk: 0.22 };
