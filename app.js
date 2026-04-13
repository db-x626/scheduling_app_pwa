let state = {
  customers: [],
  services: [],
  bookings: [],
  bookingDates: []
};

let currentPage = "today";
let currentInvoiceCustomerId = null;

/* STORAGE */
function saveState() {
  localStorage.setItem('schedulerState', JSON.stringify(state));
}

function loadState() {
  try {
    const saved = localStorage.getItem('schedulerState');
    if (saved) state = JSON.parse(saved);
  } catch(e) {
    console.error('Failed to load state:', e);
  }
}

function id() {
  return crypto.randomUUID();
}

/* PAGE */
function showPage(page) {
  currentPage = page;
  ["today","customers","services","create","schedule","billing","invoice","data"]
    .forEach(p=>{
      document.getElementById("page-"+p).style.display =
        p===page ? "block" : "none";
    });

  if(page==="today") renderToday();
  if(page==="schedule") renderSchedule();
  if(page==="billing") renderBilling();
  if(page==="invoice") renderInvoice();
}

/* MENU */
function toggleMenu(id) {
  document.querySelectorAll(".menu-dropdown").forEach(m=>{
    if(m.id!==id) m.style.display="none";
  });

  const el=document.getElementById(id);
  el.style.display = el.style.display==="block"?"none":"block";
}

document.addEventListener("click", e=>{
  if(!e.target.closest(".menu-wrap")){
    document.querySelectorAll(".menu-dropdown")
      .forEach(m=>m.style.display="none");
  }
});

/* COLOR */
function getColor(id){
  let hash=0;
  for(let i=0;i<id.length;i++){
    hash=id.charCodeAt(i)+((hash<<5)-hash);
  }

  const colors=[
    "#e57373","#64b5f6","#81c784","#ffd54f",
    "#ba68c8","#4db6ac","#ff8a65","#a1887f"
  ];

  return colors[Math.abs(hash)%colors.length];
}

/* CUSTOMERS */
function addCustomer(){
  const name = custName.value.trim();
  const pets = custPets.value.trim();
  const addr = custAddr.value.trim();
  if(!name || !pets || !addr) return;

  state.customers.push({
    id:id(),
    name,
    pets,
    address:addr,
    notes:custNotes.value.trim()
  });

  custName.value="";
  custPets.value="";
  custAddr.value="";
  custNotes.value="";

  saveState();
  render();
}

function editCustomer(id){
  const c=state.customers.find(x=>x.id===id);
  if(!c) return;

  const name=prompt("Name",c.name);
  const pets=prompt("Pets",c.pets);
  const address=prompt("Address",c.address);

  if(name !== null) c.name=name;
  if(pets !== null) c.pets=pets;
  if(address !== null) c.address=address;

  saveState();
  render();
}

function deleteCustomer(id){
  if(!confirm('Delete this customer? This action cannot be undone.')) return;
  state.customers=state.customers.filter(c=>c.id!==id);
  state.bookings=state.bookings.filter(b=>b.customerId!==id);
  saveState();
  render();
}

/* SERVICES */
function addService(){
  const name = servName.value.trim();
  const price = Number(servPrice.value);
  if(!name || price <= 0) return;

  state.services.push({
    id:id(),
    name,
    price
  });

  servName.value="";
  servPrice.value="";
  saveState();
  render();
}

function editService(id){
  const s=state.services.find(x=>x.id===id);
  if(!s) return;

  const name=prompt("Name",s.name);
  const price=prompt("Price",s.price);

  if(name) s.name=name;
  if(price) s.price=Number(price);

  saveState();
  render();
}

function deleteService(id){
  if(!confirm('Delete this service? This action cannot be undone.')) return;
  state.services=state.services.filter(s=>s.id!==id);
  saveState();
  render();
}

/* TIME */
function buildTime(){
  for(let i=1;i<=12;i++)
    bookingHour.innerHTML+=`<option>${i}</option>`;

  for(let i=0;i<60;i+=5)
    bookingMinute.innerHTML+=`<option>${String(i).padStart(2,"0")}</option>`;

  bookingAmPm.innerHTML=`<option>AM</option><option>PM</option>`;
}

function formatDate(date){
  const y=date.getFullYear();
  const m=String(date.getMonth()+1).padStart(2,'0');
  const d=String(date.getDate()).padStart(2,'0');
  return `${y}-${m}-${d}`;
}

function parseTime(timeStr){
  const [time, ampm] = timeStr.split(' ');
  const [hour, minute] = time.split(':').map(Number);
  let hour24 = hour;
  if(ampm === 'AM' && hour === 12) hour24 = 0;
  if(ampm === 'PM' && hour !== 12) hour24 += 12;
  return hour24 * 60 + minute;
}

function toggleElement(elementId){
  const el = document.getElementById(elementId);
  if(el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
}

/* BOOKINGS */
function createBookings(){
  const service=state.services.find(s=>s.id===bookingService.value);
  const dates = state.bookingDates.length ? state.bookingDates : [bookingDate.value];
  if(!service||!dates.length||!dates[0]) return;

  const time=`${bookingHour.value}:${bookingMinute.value} ${bookingAmPm.value}`;

  dates.forEach(date=>{
    if(!date) return;
    state.bookings.push({
      id:id(),
      customerId:bookingCustomer.value,
      serviceId:bookingService.value,
      date,
      time,
      status:"scheduled",
      price:service.price,
      paid: false
    });
  });

  state.bookingDates=[];
  saveState();
  render();
  renderToday();
}

/* ACTIONS */
function completeBooking(id){
  const b=state.bookings.find(x=>x.id===id);
  if(b) b.status="completed";

  saveState();
  renderSchedule();
  renderToday();
}

function deleteBooking(id){
  if(!confirm('Delete this booking? This action cannot be undone.')) return;
  state.bookings=state.bookings.filter(b=>b.id!==id);
  saveState();
  renderSchedule();
  renderToday();
}

function editBooking(id){
  const b=state.bookings.find(x=>x.id===id);
  if(!b) return;

  const date=prompt("Date",b.date);
  const time=prompt("Time",b.time);

  if(date) b.date=date;
  if(time) b.time=time;

  saveState();
  renderSchedule();
}

function addBookingDate(){
  const date=bookingDate.value;
  if(!date||state.bookingDates.includes(date)) return;
  state.bookingDates.push(date);
  renderBookingDates();
}

function removeBookingDate(date){
  state.bookingDates=state.bookingDates.filter(d=>d!==date);
  renderBookingDates();
}

function generateRecurringDates(){
  const start=bookingStartDate.value;
  const end=bookingEndDate.value;
  const weekdays=[...document.querySelectorAll('.bookingWeekday:checked')]
    .map(input=>Number(input.value));

  if(!start||!end||weekdays.length===0) return;

  const from=new Date(start);
  const to=new Date(end);
  if(from > to) return;

  const seen = new Set(state.bookingDates);
  const current = new Date(from);
  
  while(current.getTime() <= to.getTime()){
    if(weekdays.includes(current.getDay())){
      const date=formatDate(current);
      if(!seen.has(date)) {
        state.bookingDates.push(date);
        seen.add(date);
      }
    }
    current.setDate(current.getDate()+1);
  }
  renderBookingDates();
}

function clearBookingDates(){
  state.bookingDates=[];
  renderBookingDates();
}

function renderBookingDates(){
  bookingDateList.innerHTML=state.bookingDates
    .map(date=>`
      <div class="date-pill">
        ${date}
        <button class="remove-date" onclick="removeBookingDate('${date}')">×</button>
      </div>
    `).join("");
}

/* TODAY */
function todayStr(){
  return formatDate(new Date());
}

function renderToday(){
  const today=todayStr();

  todayScheduled.innerHTML="";
  todayCompleted.innerHTML="";

  const todayBookings = state.bookings.filter(b=>b.date===today);

  todayBookings
    .sort((a,b)=>parseTime(a.time) - parseTime(b.time))
    .forEach(b=>{

      const c=state.customers.find(x=>x.id===b.customerId);
      const s=state.services.find(x=>x.id===b.serviceId);

      const color=getColor(b.customerId);

      const div=document.createElement("div");
      div.className="client-color";
      div.style.borderColor=color;

      const menuId="menu-today-"+b.id;

      div.innerHTML=`
        <strong>${b.time}</strong> | ${c?.name} | 🐾 ${c?.pets} | ${s?.name}
        <br><span style="color:#aaa">${c?.address}</span>

        <div class="menu-wrap">
          <button class="menu-btn" onclick="toggleMenu('${menuId}')">☰</button>
          <div class="menu-dropdown" id="${menuId}">
            <button onclick="completeBooking('${b.id}')">Complete</button>
            <button onclick="deleteBooking('${b.id}')">Delete</button>
          </div>
        </div>
      `;

      (b.status==="completed"?todayCompleted:todayScheduled)
        .appendChild(div);
    });

  // Initially collapse sections
  todayScheduled.style.display = 'none';
  todayCompleted.style.display = 'none';
}

function toggleTodaySection(sectionId){
  toggleElement(sectionId);
}

function toggleCustomerList(){
  toggleElement('customerList');
}

/* SCHEDULE */
function renderSchedule(){
  scheduleList.innerHTML="";

  const grouped={};

  state.bookings.forEach(b=>{
    if(!grouped[b.date]) grouped[b.date]=[];
    grouped[b.date].push(b);
  });

  Object.keys(grouped).sort().forEach(date=>{
    const bookingsId = `schedule-bookings-${date}`;
    
    const day=document.createElement("div");
    day.className="day";

    const titleDiv = document.createElement("div");
    titleDiv.style.display = "flex";
    titleDiv.style.alignItems = "center";
    titleDiv.style.gap = "10px";
    titleDiv.innerHTML = `
      <button onclick="toggleScheduleDay('${bookingsId}')" style="flex: 1; text-align: left; padding: 10px;">
        <div class="day-title" style="display: inline-block; margin: 0;">${date} ▼</div>
      </button>
    `;

    day.appendChild(titleDiv);

    const bookingsContainer = document.createElement("div");
    bookingsContainer.id = bookingsId;
    bookingsContainer.style.marginLeft = "20px";

    grouped[date]
      .sort((a,b)=>parseTime(a.time) - parseTime(b.time))
      .forEach(b=>{
        const c=state.customers.find(x=>x.id===b.customerId);
        const s=state.services.find(x=>x.id===b.serviceId);

        const color=getColor(b.customerId);

        const div=document.createElement("div");
        div.className="client-color";
        div.style.borderColor=color;

        const menuId="menu-book-"+b.id;

        div.innerHTML=`
          <strong>${b.time}</strong> | ${c?.name} | 🐾 ${c?.pets} | ${s?.name}
          <br><span style="color:#aaa">${c?.address}</span>
          <br><span style="color:#888">${b.status}</span>

          <div class="menu-wrap">
            <button class="menu-btn" onclick="toggleMenu('${menuId}')">☰</button>
            <div class="menu-dropdown" id="${menuId}">
              <button onclick="completeBooking('${b.id}')">Complete</button>
              <button onclick="editBooking('${b.id}')">Edit</button>
              <button onclick="deleteBooking('${b.id}')">Delete</button>
            </div>
          </div>
        `;

        bookingsContainer.appendChild(div);
      });

    day.appendChild(bookingsContainer);
    scheduleList.appendChild(day);
  });
}

function toggleScheduleDay(bookingsId){
  toggleElement(bookingsId);
}

/* BILLING */
function renderBilling(){
  billingList.innerHTML="";
  state.customers.filter(c => state.bookings.some(b => b.customerId === c.id && b.status === "completed")).forEach(c=>{
    const div=document.createElement("div");
    div.style.marginBottom = "20px";
    const toggleId = `billing-toggle-${c.id}`;
    const listId = `billing-list-${c.id}`;

    div.innerHTML=`
      <button onclick="toggleBilling('${listId}')">${c.name} ▼</button>
      <button onclick="clearCustomerTotals('${c.id}')">Clear $</button>
      <button onclick="showInvoice('${c.id}')">Invoice</button>
      <div id="${listId}" style="display: none; margin-left: 20px;">
      </div>
    `;

    const listDiv = div.querySelector(`#${listId}`);
    const completedBookings = state.bookings.filter(b=>b.customerId===c.id && b.status==="completed")
      .sort((a,b)=>parseTime(a.time) - parseTime(b.time));
    completedBookings.forEach(b=>{
      const s = state.services.find(s=>s.id===b.serviceId);
      const subDiv = document.createElement("div");
      subDiv.innerHTML = `
        <label>
          <input type="checkbox" ${b.paid ? 'checked' : ''} onchange="togglePaid('${b.id}', this.checked)">
          ${s?.name} - ${b.date} - Pets: ${c.pets || 'None'} - $${b.price}
        </label>
      `;
      listDiv.appendChild(subDiv);
    });

    billingList.appendChild(div);
  });
}

function toggleBilling(listId){
  toggleElement(listId);
}

function togglePaid(bookingId, paid){
  const b = state.bookings.find(b=>b.id===bookingId);
  if(b) b.paid = paid;
  saveState();
}

function clearCustomerTotals(customerId){
  if(!confirm('Mark all bookings as paid for this customer?')) return;
  state.bookings.forEach(b=>{
    if(b.customerId === customerId && b.status === "completed") b.paid = true;
  });
  saveState();
  renderBilling();
}

function toggleCustomerDetails(detailsId){
  toggleElement(detailsId);
}

/* UI */
function renderCustomers(){
  customerList.innerHTML="";
  state.customers.forEach(c=>{
    const menuId="menu-cust-"+c.id;
    const detailsId = `cust-details-${c.id}`;

    const div=document.createElement("div");
    div.style.marginBottom = "15px";

    div.innerHTML=`
      <div style="display: flex; align-items: center; gap: 10px;">
        <button onclick="toggleCustomerDetails('${detailsId}')">${c.name} ▼</button>
        <div class="menu-wrap">
          <button class="menu-btn" onclick="toggleMenu('${menuId}')">☰</button>
          <div class="menu-dropdown" id="${menuId}">
            <button onclick="editCustomer('${c.id}')">Edit</button>
            <button onclick="deleteCustomer('${c.id}')">Delete</button>
          </div>
        </div>
      </div>
      <div id="${detailsId}" style="display: none; margin-left: 20px;">
        Pets: ${c.pets || 'None'}<br>
        Address: ${c.address || 'N/A'}
      </div>
    `;

    customerList.appendChild(div);
  });

  // Initially collapse customer list
  customerList.style.display = 'none';
}

function renderServices(){
  serviceList.innerHTML="";
  state.services.forEach(s=>{
    const menuId="menu-serv-"+s.id;

    const div=document.createElement("div");

    div.innerHTML=`
      ${s.name} - $${s.price}

      <div class="menu-wrap">
        <button class="menu-btn" onclick="toggleMenu('${menuId}')">☰</button>
        <div class="menu-dropdown" id="${menuId}">
          <button onclick="editService('${s.id}')">Edit</button>
          <button onclick="deleteService('${s.id}')">Delete</button>
        </div>
      </div>
    `;

    serviceList.appendChild(div);
  });
}

/* DATA BACKUP */
function exportData(){
  const dataStr = JSON.stringify(state, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `scheduler-backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function importData(){
  const fileInput = document.getElementById('dataImportFile');
  const file = fileInput.files[0];
  const statusEl = document.getElementById('importStatus');
  
  if(!file) {
    statusEl.textContent = '❌ Please select a file';
    statusEl.style.color = '#DC143C';
    return;
  }
  
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const imported = JSON.parse(e.target.result);
      
      if(!imported.customers || !imported.services || !imported.bookings) {
        throw new Error('Invalid backup file structure');
      }
      
      state = imported;
      saveState();
      fileInput.value = '';
      render();
      renderToday();
      
      statusEl.textContent = '✓ Data imported successfully!';
      statusEl.style.color = '#228B22';
      setTimeout(() => { statusEl.textContent = ''; }, 3000);
    } catch(error) {
      statusEl.textContent = `❌ Import failed: ${error.message}`;
      statusEl.style.color = '#DC143C';
    }
  };
  reader.readAsText(file);
}

/* INVOICE */
function showInvoice(customerId){
  currentInvoiceCustomerId = customerId;
  showPage('invoice');
}

function renderInvoice(){
  if(!currentInvoiceCustomerId) return;
  
  const customer = state.customers.find(c => c.id === currentInvoiceCustomerId);
  if(!customer) return;
  
  const completedBookings = state.bookings
    .filter(b => b.customerId === currentInvoiceCustomerId && b.status === "completed")
    .sort((a,b) => a.date.localeCompare(b.date));
  
  const invoiceContent = document.getElementById('invoiceContent');
  
  let html = `
    <div style="border: 2px solid #333; padding: 30px; background: white; max-width: 600px; color: #000; font-size: 16px; font-family: Arial, sans-serif;">
      <h3 style="text-align: center; color: #000; font-size: 24px; margin: 0 0 20px 0;">INVOICE</h3>
      <hr style="border: none; border-top: 2px solid #333; margin: 15px 0;">
      <div style="margin: 15px 0; line-height: 1.8;">
        <p style="color: #000; font-size: 16px; margin: 8px 0;"><strong style="color: #000;">Customer:</strong> <span style="color: #000;">${customer.name}</span></p>
        <p style="color: #000; font-size: 16px; margin: 8px 0;"><strong style="color: #000;">Pets:</strong> <span style="color: #000;">${customer.pets || 'None'}</span></p>
        <p style="color: #000; font-size: 16px; margin: 8px 0;"><strong style="color: #000;">Address:</strong> <span style="color: #000;">${customer.address}</span></p>
      </div>
      <hr style="border: none; border-top: 2px solid #333; margin: 15px 0;">
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="border-bottom: 2px solid #333; background: #f5f5f5;">
            <th style="text-align: left; padding: 12px; color: #000; font-weight: bold; font-size: 15px;">Date</th>
            <th style="text-align: left; padding: 12px; color: #000; font-weight: bold; font-size: 15px;">Service</th>
            <th style="text-align: right; padding: 12px; color: #000; font-weight: bold; font-size: 15px;">Amount</th>
            <th style="text-align: center; padding: 12px; color: #000; font-weight: bold; font-size: 15px;">Paid</th>
          </tr>
        </thead>
        <tbody>
  `;
  
  let total = 0;
  let paidAmount = 0;
  
  completedBookings.forEach(b => {
    const service = state.services.find(s => s.id === b.serviceId);
    const isPaid = b.paid ? '✓' : '';
    html += `
      <tr style="border-bottom: 1px solid #ddd;">
        <td style="padding: 12px; color: #000; font-size: 15px;">${b.date}</td>
        <td style="padding: 12px; color: #000; font-size: 15px;">${service?.name || 'Unknown'}</td>
        <td style="text-align: right; padding: 12px; color: #000; font-size: 15px;">$${b.price.toFixed(2)}</td>
        <td style="text-align: center; padding: 12px; color: ${b.paid ? '#228B22' : '#DC143C'}; font-size: 16px; font-weight: bold;">${isPaid}</td>
      </tr>
    `;
    total += b.price;
    if(b.paid) paidAmount += b.price;
  });
  
  const balance = total - paidAmount;
  
  html += `
        </tbody>
      </table>
      <hr style="border: none; border-top: 2px solid #333; margin: 15px 0;">
      <div style="text-align: right; padding: 15px 0; font-size: 16px;">
        <p style="color: #000; margin: 10px 0;"><strong style="color: #000; font-size: 17px;">Total: $${total.toFixed(2)}</strong></p>
        <p style="color: #000; margin: 10px 0;"><strong style="color: #228B22; font-size: 17px;">Paid: $${paidAmount.toFixed(2)}</strong></p>
        <p style="color: ${balance > 0 ? '#DC143C' : '#228B22'}; margin: 10px 0;"><strong style="font-size: 18px;">Balance Due: $${balance.toFixed(2)}</strong></p>
      </div>
      <hr style="border: none; border-top: 1px solid #ccc; margin: 15px 0;">
      <p style="color: #333; font-size: 13px; text-align: center; margin: 15px 0;">
        Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}
      </p>
    </div>
  `;
  
  invoiceContent.innerHTML = html;
}

function printInvoice(){
  const invoiceDiv = document.getElementById('invoiceContent').innerHTML;
  const printWindow = window.open('', '', 'width=600,height=600');
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Invoice</title>
      <style>
        body { font-family: Arial, sans-serif; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 8px; text-align: left; }
        th { border-bottom: 2px solid #333; }
        tr { border-bottom: 1px solid #eee; }
      </style>
    </head>
    <body>${invoiceDiv}</body>
    </html>
  `);
  printWindow.document.close();
  printWindow.print();
}

function renderDropdowns(){
  bookingCustomer.innerHTML = state.customers
    .map(c=>`<option value="${c.id}">${c.name}</option>`)
    .join('');
  bookingService.innerHTML = state.services
    .map(s=>`<option value="${s.id}">${s.name}</option>`)
    .join('');
}

/* RENDER */
function render(){
  renderCustomers();
  renderServices();
  renderDropdowns();
  renderBookingDates();
}

/* INIT */
loadState();
buildTime();
render();
showPage("today");

/* SERVICE WORKER REGISTRATION */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('ServiceWorker registered successfully');
      })
      .catch(error => {
        console.log('ServiceWorker registration failed:', error);
      });
  });
}