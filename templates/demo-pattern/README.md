# Demo Pattern

A high-quality demonstration pattern for the Claude Starter Kit.

## Usage

This pattern demonstrates best practices for:
- Clear documentation
- Comprehensive testing
- Security considerations
- Maintainable code structure

## Installation

```bash
npm install
python -m pip install -r requirements.txt
```

## Configuration

Create a `.env` file with your configuration:

```bash
DEMO_API_KEY=your_api_key_here
DEMO_DEBUG=false
```

## Example

```python
from demo_pattern import DemoClass

demo = DemoClass()
result = demo.process_data("example input")
print(result)
```

## Security

This pattern follows security best practices:
- No hardcoded secrets
- Input validation
- Secure defaults
- Regular dependency updates

## Testing

Run tests with:

```bash
pytest tests/
```

## Contributing

Please follow the coding standards and include tests for new features.