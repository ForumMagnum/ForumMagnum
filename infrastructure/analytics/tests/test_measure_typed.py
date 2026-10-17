import math

from measure_typed import same_value


def test_float_readback_tolerance_is_bounded_in_binary_steps_only():
    expected = float.fromhex('0x1.82dfec0000000p-14')
    rounding = {'values': 0, 'max_ulps': 0}
    assert same_value(math.nextafter(expected, math.inf), expected, rounding)
    assert rounding == {'values': 1, 'max_ulps': 1}
    assert not same_value(expected * 1.000001, expected, rounding)
    assert not same_value(2e-200, 1e-200, rounding)
    assert not same_value(float('nan'), expected, rounding)
    assert not same_value(float('inf'), expected, rounding)


def test_float_tolerance_cannot_hide_identity_or_raw_text_changes():
    rounding = {'values': 0, 'max_ulps': 0}
    assert not same_value(9007199254740993, 9007199254740992, rounding)
    assert not same_value('{"score":1.0}', '{"score":1.1}', rounding)
    assert not same_value(['a', 'b'], ['b', 'a'], rounding)
    assert not same_value({'score': None}, {'score': 0.0}, rounding)
    assert rounding['values'] == 0
