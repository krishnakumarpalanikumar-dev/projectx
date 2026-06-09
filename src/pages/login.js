export function renderLogin(container) {
  container.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: center; height: 100vh; background: var(--gradient-hero);">
      <div style="background: white; padding: 40px; border-radius: var(--radius-xl); box-shadow: var(--shadow-xl); width: 100%; max-width: 400px; text-align: center;">
        <h2 style="color: var(--gray-900); font-size: 1.8rem; margin-bottom: 24px;">Admin Login</h2>
        <form id="logo-login-form" style="display: flex; flex-direction: column; gap: 16px;">
          <div>
            <input type="text" id="login-user" placeholder="Username" style="width: 100%; padding: 12px; border: 1px solid var(--gray-300); border-radius: var(--radius-md); font-size: 1rem;" />
          </div>
          <div>
            <input type="password" id="login-pass" placeholder="Password" style="width: 100%; padding: 12px; border: 1px solid var(--gray-300); border-radius: var(--radius-md); font-size: 1rem;" />
          </div>
          <button type="submit" class="btn btn-primary" style="width: 100%; justify-content: center; padding: 12px; font-size: 1rem;">Login</button>
          <p id="login-error" style="color: var(--danger); font-size: 0.85rem; margin-top: 8px; display: none;">Invalid username or password.</p>
        </form>
      </div>
    </div>
  `;

  document.getElementById('logo-login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const user = document.getElementById('login-user').value;
    const pass = document.getElementById('login-pass').value;
    
    if (user === '230608' && pass === 'krishna007') {
      window.navigateTo('secret');
    } else {
      document.getElementById('login-error').style.display = 'block';
    }
  });
}
