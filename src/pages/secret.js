export function renderSecret(container) {
  container.innerHTML = `
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; text-align: center;">
      <div style="background: var(--gradient-hero); padding: 40px; border-radius: var(--radius-xl); box-shadow: var(--shadow-xl); max-width: 600px;">
        <h2 style="color: white; font-size: 2rem; margin-bottom: 16px;">Secret Admin Area</h2>
        <p style="color: rgba(255,255,255,0.8); margin-bottom: 24px;">Welcome back, Krishna. This is the hidden page accessible only via the logo login.</p>
        <button class="btn btn-primary" onclick="window.navigateTo('dashboard')">Return to Dashboard</button>
      </div>
    </div>
  `;
}
