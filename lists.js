/* =====================================================================
   Padhai Adda - lists shared by the website and the admin page.
   Edit the lists below to change the choices people see in the dropdowns.
   Rules: keep every item inside quotes 'like this' and separate items with commas.
   ===================================================================== */

// States and Union Territories. The names MUST match STATES in Code.gs and the file names in /locations.
const STATES = ['Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'];

const OPTIONS = {
  qualifications: ['Class 12 Pass', 'B.A.', 'B.Sc.', 'B.Com.', 'B.Tech', 'B.Ed.', 'M.A.', 'M.Sc.', 'M.Tech', 'PhD'],
  classes: ['Nursery-KG', ...Array.from({ length: 12 }, (_, i) => 'Class ' + (i + 1)), 'College'],
  subjects: ['Mathematics', 'Science', 'Physics', 'Chemistry', 'Biology', 'English', 'Hindi', 'Social Science', 'Computer Science', 'Accountancy', 'Economics'],
  modes: ['At Student Home', 'At Tutor Place', 'Online']
};

/* ---------------------------------------------------------------------
   Cities and areas. They are NOT typed here: each state has its own file in the
   /locations folder (for example /locations/uttar_pradesh.js). The website loads
   a state's file only when that state is chosen, so no server call is needed.
   --------------------------------------------------------------------- */
const LOCATIONS = {};
const stateSlug = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

const _locLoads = {};
/** Loads /locations/<state>.js and returns the state's data: { "City": ["Area", ...], ... } */
function loadStateFile(state, fresh) {
  if (!fresh && _locLoads[state]) return _locLoads[state];
  const p = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = '/locations/' + stateSlug(state) + '.js' + (fresh ? '?t=' + Date.now() : '');
    s.onload = () => resolve(LOCATIONS[state] || {});
    s.onerror = () => { delete _locLoads[state]; reject(new Error('Could not load the cities for ' + state + '. Check your internet connection and try again.')); };
    document.head.appendChild(s);
  });
  _locLoads[state] = p;
  return p;
}
/** Same data as a flat list of [city, area] pairs, which is what the dropdowns use. */
const stateLocations = state => loadStateFile(state).then(o => Object.keys(o).flatMap(c => (o[c] || []).map(z => [c, z])));
