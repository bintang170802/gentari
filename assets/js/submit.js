document.getElementById('form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const form = e.target;
  const data = {
    name: form.name.value,
    email: form.email.value,
    message: form.message.value,
  };

  try {
    const res = await fetch('/.netlify/functions/submitForm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const result = await res.json();
    if (res.ok) {
      alert('Form submitted successfully!');
      form.reset();
    } else {
      alert('Error: ' + result.error);
    }
  } catch (err) {
    alert('Failed to submit: ' + err.message);
  }
});